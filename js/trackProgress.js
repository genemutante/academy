import { supabase } from './supabaseClient.js';
import { carregarProgressoCurso } from './carregarProgressoCurso.js';

let tempoInicioSegmento = null;
let ultimoTempoVerificado = 0;

export async function trackProgress() {
  // LOG DE MONITORAMENTO
  if (!window.player || typeof window.player.getPlayerState !== 'function') {
      console.warn("⚠️ [Monitor] Player não encontrado ou não inicializado na window.");
      return;
  }

  const estado = window.player.getPlayerState();
  const tempoAtual = Math.floor(window.player.getCurrentTime() || 0);

  // Log para debug no console
  console.log(`🎬 [Monitor] Estado: ${estado} | Tempo: ${tempoAtual}s | Início Seg: ${tempoInicioSegmento}`);

  if (window.aulaFinalizada) return;

  // 1. Iniciar segmento (Estado 1 = Tocando)
  if (estado === 1 && tempoInicioSegmento === null) {
    tempoInicioSegmento = tempoAtual;
    ultimoTempoVerificado = tempoAtual;
    console.log("🟢 [Monitor] Iniciando contagem de novo segmento.");
    return;
  }

  // 2. Fechar segmento por pausa ou fim (Qualquer estado que não seja Tocando)
  if (estado !== 1 && tempoInicioSegmento !== null) {
    console.log("⏸️ [Monitor] Vídeo parado/pausado. Salvando trecho...");
    await fecharESalvarSegmento(tempoAtual);
    return;
  }

  // 3. Verificação de Pulo ou Progresso Contínuo
  if (tempoInicioSegmento !== null) {
    const saltou = Math.abs(tempoAtual - ultimoTempoVerificado) > 2;
    
    if (saltou) {
      console.log("⏩ [Monitor] Pulo detectado! Salvando segmento anterior.");
      await fecharESalvarSegmento(ultimoTempoVerificado);
      tempoInicioSegmento = tempoAtual; // Reinicia no novo ponto após o pulo
    } 
    else if (tempoAtual - tempoInicioSegmento >= 10) {
      console.log("⏲️ [Monitor] 10 segundos atingidos. Gravando bloco preventivo...");
      await fecharESalvarSegmento(tempoAtual);
      tempoInicioSegmento = tempoAtual; // Reinicia para o próximo bloco de 10s
    }
  }

  ultimoTempoVerificado = tempoAtual;
}

async function fecharESalvarSegmento(tempoFim) {
  // Evita salvar se não houver tempo decorrido
  if (tempoInicioSegmento === null || tempoInicioSegmento === tempoFim) {
    tempoInicioSegmento = null;
    return;
  }

  const segmento = {
    start: tempoInicioSegmento,
    end: tempoFim
  };

  console.log("💾 [DB] Tentando salvar segmento no Supabase:", segmento);

  // Reseta o início para evitar duplicidade enquanto processa o banco
  const inicioParaSalvar = tempoInicioSegmento;
  tempoInicioSegmento = null;

  const { error } = await supabase
    .from('progress_segments')
    .insert({
      user_id: window.user_id,
      course_id: window.course_id,
      lesson_id: window.aulaAtual?.id,
      duration: window.aulaAtual?.duration || 0,
      segment: { start: inicioParaSalvar, end: tempoFim }
    });

  if (error) {
    console.error("❌ [DB] Erro ao salvar segmento:", error.message);
    // Em caso de erro, permite tentar novamente no próximo ciclo
    tempoInicioSegmento = inicioParaSalvar; 
  } else {
    console.log("✅ [DB] Segmento salvo com sucesso!");
    
    // --- ATUALIZAÇÃO DA INTERFACE EM TEMPO REAL ---
    
    // 1. Atualiza a barra de porcentagem no topo
    await carregarProgressoCurso(supabase, window.user_id, window.course_id);
    
    // 2. Atualiza os checks (✅) na lista lateral se a função listarAulas existir
    if (typeof window.listarAulas === 'function') {
        // Usamos as aulas e a função de seleção que estão na window
        window.listarAulas(window.aulas, window.selecionarAula);
    } else {
        console.warn("⚠️ Função listarAulas não encontrada no escopo global.");
    }
  }
}
