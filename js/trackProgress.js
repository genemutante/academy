import { supabase } from './supabaseClient.js';

let tempoInicioSegmento = null;
let ultimoTempoVerificado = 0;
let ultimaExecucaoReal = Date.now();

export async function trackProgress() {
  if (!window.player || typeof window.player.getPlayerState !== 'function') return;

  const estado = window.player.getPlayerState();
  const tempoAtual = Math.floor(window.player.getCurrentTime() || 0);
  
  const agora = Date.now();
  const decorridoReal = (agora - ultimaExecucaoReal) / 1000;
  ultimaExecucaoReal = agora;

  if (window.aulaFinalizada) return;

  // 1. Iniciar segmento
  if (estado === 1 && tempoInicioSegmento === null) {
    tempoInicioSegmento = tempoAtual;
    ultimoTempoVerificado = tempoAtual;
    console.log("🟢 [Monitor] Iniciando segmento em:", tempoAtual);
    return;
  }

  // 2. Fechar segmento por pausa
  if (estado !== 1 && tempoInicioSegmento !== null) {
    console.log("⏸️ [Monitor] Pausa detectada. Salvando...");
    await fecharESalvarSegmento(tempoAtual);
    return;
  }

  // 3. Verificação de Pulo ou Bloco de 10s
  if (tempoInicioSegmento !== null) {
    const diffVideo = Math.abs(tempoAtual - ultimoTempoVerificado);
    const saltou = diffVideo > (decorridoReal + 3); 
    
    if (saltou) {
      console.log(`⏩ [Monitor] Pulo detectado! Salvando trecho anterior.`);
      await fecharESalvarSegmento(ultimoTempoVerificado);
      tempoInicioSegmento = tempoAtual;
    } 
    else if (tempoAtual - tempoInicioSegmento >= 10) {
      console.log("⏲️ [Monitor] Bloco de 10s atingido. Gravando...");
      await fecharESalvarSegmento(tempoAtual);
      tempoInicioSegmento = tempoAtual;
    }
  }

  ultimoTempoVerificado = tempoAtual;
}

async function fecharESalvarSegmento(tempoFim) {
  if (tempoInicioSegmento === null || tempoInicioSegmento === tempoFim) {
    tempoInicioSegmento = null;
    return;
  }

  const segmento = { start: tempoInicioSegmento, end: tempoFim };
  const lessonId = window.aulaAtual?.id;
  const userId = window.user_id;

  // Reseta para o próximo ciclo
  tempoInicioSegmento = null;

  // 💾 GRAVAÇÃO NO BANCO
  const { error: insertError } = await supabase
    .from('progress_segments')
    .insert({
      user_id: userId,
      course_id: window.course_id,
      lesson_id: lessonId,
      duration: window.aulaAtual?.duration || 0,
      segment: segmento
    });

  if (insertError) {
    console.error("❌ [DB] Erro ao salvar segmento:", insertError.message);
    return;
  }

  console.log("✅ [DB] Segmento salvo. Atualizando Progresso da Aula...");

  // 🎯 ATUALIZAÇÃO CIRÚRGICA VIA RPC (fn_progresso_por_usuario_e_aula)
  const { data: rpcData, error: rpcError } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
    p_user_id: userId,
    p_lesson_id: lessonId
  });

  if (!rpcError && rpcData && rpcData.length > 0) {
    const progresso = rpcData[0]; // Dados processados pela sua função SQL

    // Elementos da UI abaixo do vídeo
    const barra = document.getElementById("barraProgresso");
    const texto = document.getElementById("progressoTexto");

    // Injeção direta dos segundos reais e percentual assistido
    if (barra) barra.style.width = `${progresso.percentual_assistido}%`;
    if (texto) {
      texto.textContent = `${progresso.segundos_assistidos}s assistidos de ${progresso.duracao_total}s (${progresso.percentual_assistido}%)`;
    }

    // Gerenciamento do status da aula
    if (progresso.status === '✔ Concluída') {
      window.aulaFinalizada = true;
      console.log("🎓 Aula Concluída!");
    }

    // Sincroniza a lista lateral para mostrar o check (✅) ou 'Em andamento'
    if (typeof window.listarAulas === 'function') {
      window.listarAulas(window.aulas, window.selecionarAula);
    }
  } else if (rpcError) {
    console.error("❌ [RPC] Erro ao calcular progresso da aula:", rpcError.message);
  }
}
