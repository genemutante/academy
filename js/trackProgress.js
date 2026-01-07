import { supabase } from './supabaseClient.js';
import { carregarProgressoCurso } from './carregarProgressoCurso.js';

let tempoInicioSegmento = null;
let ultimoTempoVerificado = 0;
let ultimaExecucaoReal = Date.now(); // ⏱️ Adicionado para medir tempo real do relógio

export async function trackProgress() {
  if (!window.player || typeof window.player.getPlayerState !== 'function') return;

  const estado = window.player.getPlayerState();
  const tempoAtual = Math.floor(window.player.getCurrentTime() || 0);
  
  // Cálculo de tempo real decorrido (em segundos) desde a última execução
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

  // 3. Verificação Inteligente de Pulo
  if (tempoInicioSegmento !== null) {
    const diffVideo = Math.abs(tempoAtual - ultimoTempoVerificado);
    
    // CIRURGIA AQUI: Só é pulo se o vídeo andou muito mais (ou menos) que o tempo do relógio
    // Adicionamos uma margem de erro de 3 segundos sobre o tempo real decorrido
    const saltou = diffVideo > (decorridoReal + 3); 
    
    if (saltou) {
      console.log(`⏩ [Monitor] Pulo detectado! (Vídeo moveu ${diffVideo}s, mas o relógio apenas ${decorridoReal.toFixed(1)}s)`);
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
  tempoInicioSegmento = null;

  const { error } = await supabase
    .from('progress_segments')
    .insert({
      user_id: window.user_id,
      course_id: window.course_id,
      lesson_id: window.aulaAtual?.id,
      duration: window.aulaAtual?.duration || 0,
      segment: segmento
    });

  if (!error) {
    console.log("✅ [DB] Segmento salvo:", segmento);
    // Atualiza progresso e lista lateral
    await carregarProgressoCurso(supabase, window.user_id, window.course_id);
    if (typeof window.listarAulas === 'function') {
        window.listarAulas(window.aulas, window.selecionarAula);
    }
  } else {
    console.error("❌ [DB] Erro:", error.message);
  }
}
