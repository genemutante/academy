import { supabase } from './supabaseClient.js';

let tempoInicioSegmento = null;
let ultimoTempoVerificado = 0;
let ultimaExecucaoReal = Date.now();

export async function trackProgress() {
  // Se a aula já foi concluída, paramos qualquer execução e limpamos o intervalo
  if (window.aulaFinalizada) {
    if (window.interval) clearInterval(window.interval);
    return;
  }

  if (!window.player || typeof window.player.getPlayerState !== 'function') return;

  const estado = window.player.getPlayerState();
  const tempoAtual = Math.floor(window.player.getCurrentTime() || 0);
  const duracaoTotal = Math.floor(window.player.getDuration() || 0);
  
  const agora = Date.now();
  const decorridoReal = (agora - ultimaExecucaoReal) / 1000;
  ultimaExecucaoReal = agora;

  // Não iniciamos ou processamos segmentos se o vídeo já estiver no fim absoluto
  if (tempoAtual >= duracaoTotal && duracaoTotal > 0) return;

  // 1. Iniciar segmento (Estado 1 = PLAYING)
  if (estado === 1 && tempoInicioSegmento === null) {
    tempoInicioSegmento = tempoAtual;
    ultimoTempoVerificado = tempoAtual;
    console.log("🟢 [Monitor] Iniciando segmento em:", tempoAtual);
    return;
  }

  // 2. Fechar segmento por pausa ou buffer (Estado diferente de PLAYING)
  if (estado !== 1 && tempoInicioSegmento !== null) {
    console.log("⏸️ [Monitor] Pausa ou mudança de estado. Salvando...");
    await fecharESalvarSegmento(tempoAtual);
    return;
  }

  // 3. Verificação de Pulo ou Bloco de 10s
  if (tempoInicioSegmento !== null) {
    const diffVideo = Math.abs(tempoAtual - ultimoTempoVerificado);
    
    // Detecta se o usuário "pulou" partes do vídeo
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
  // AJUSTE CRÍTICO: Evita erro 400. Nunca envia segmento onde start >= end
  if (tempoInicioSegmento === null || tempoInicioSegmento >= tempoFim) {
    console.log("⚠️ [Monitor] Segmento inválido ou zerado ignorado.");
    tempoInicioSegmento = null;
    return;
  }

  const segmento = { start: tempoInicioSegmento, end: tempoFim };
  const lessonId = window.aulaAtual?.id;
  const courseId = window.aulaAtual?.course_id; // Ajustado para pegar do objeto da aula
  const userId = window.user_id;
  const duration = window.aulaAtual?.duration || 0;

  // Reseta para o próximo ciclo ANTES do await para evitar duplicidade em chamadas rápidas
  tempoInicioSegmento = null;

  try {
    // 💾 GRAVAÇÃO NO BANCO
    const { error: insertError } = await supabase
      .from('progress_segments')
      .insert({
        user_id: userId,
        course_id: courseId,
        lesson_id: lessonId,
        duration: duration,
        segment: segmento
      });

    if (insertError) {
      console.error("❌ [DB] Erro ao salvar segmento:", insertError.message);
      return;
    }

    console.log(`✅ [DB] Segmento salvo (${segmento.start}s - ${segmento.end}s).`);

    // 🎯 ATUALIZAÇÃO VIA RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
      p_user_id: userId,
      p_lesson_id: lessonId
    });

    if (!rpcError && rpcData && rpcData.length > 0) {
      const progresso = rpcData[0];

      // Atualização visual sincronizada
      const barra = document.getElementById("barraProgresso");
      const texto = document.getElementById("progressoTexto");

      if (barra) barra.style.width = `${progresso.percentual_assistido}%`;
      if (texto) {
        texto.textContent = `${progresso.segundos_assistidos}s assistidos de ${progresso.duracao_total}s (${progresso.percentual_assistido}%)`;
      }

      // Se a RPC (com as novas regras de margem de 5s) retornar concluída
      if (progresso.status === '✔ Concluída') {
        window.aulaFinalizada = true;
        if (window.interval) clearInterval(window.interval);
        console.log("🎓 Aula Concluída via rastreamento!");
      }

      // Atualiza lista lateral se a função existir
      if (typeof window.listarAulas === 'function') {
        window.listarAulas();
      }
    } else if (rpcError) {
      console.error("❌ [RPC] Erro ao calcular progresso:", rpcError.message);
    }
  } catch (e) {
    console.error("❌ [Track] Falha geral na execução:", e);
  }
}
