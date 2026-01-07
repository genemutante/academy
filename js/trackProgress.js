import { supabase } from './supabaseClient.js';
import { carregarProgressoCurso } from './carregarProgressoCurso.js';

let tempoInicioSegmento = null;
let ultimoTempoVerificado = 0;

export async function trackProgress() {
  // LOG DE MONITORAMENTO
  if (!window.player) {
      console.warn("⚠️ [Monitor] Player não encontrado na window.");
      return;
  }

  const estado = window.player.getPlayerState?.();
  const tempoAtual = Math.floor(window.player.getCurrentTime?.() || 0);

  console.log(`🎬 [Monitor] Estado: ${estado} | Tempo: ${tempoAtual}s | Início Seg: ${tempoInicioSegmento}`);

  if (window.aulaFinalizada) return;

  // 1. Iniciar segmento
  if (estado === 1 && tempoInicioSegmento === null) {
    tempoInicioSegmento = tempoAtual;
    ultimoTempoVerificado = tempoAtual;
    console.log("🟢 [Monitor] Iniciando contagem de novo segmento.");
    return;
  }

  // 2. Fechar segmento por pausa
  if (estado !== 1 && tempoInicioSegmento !== null) {
    console.log("⏸️ [Monitor] Vídeo não está mais tocando. Salvando trecho...");
    await fecharESalvarSegmento(tempoAtual);
    return;
  }

  if (tempoInicioSegmento !== null) {
    const saltou = Math.abs(tempoAtual - ultimoTempoVerificado) > 2;
    
    if (saltou) {
      console.log("⏩ [Monitor] Pulo detectado!");
      await fecharESalvarSegmento(ultimoTempoVerificado);
      tempoInicioSegmento = tempoAtual;
    } 
    else if (tempoAtual - tempoInicioSegmento >= 10) {
      console.log("⏲️ [Monitor] 10 segundos atingidos. Gravando bloco...");
      await fecharESalvarSegmento(tempoAtual);
      tempoInicioSegmento = tempoAtual;
    }
  }

  ultimoTempoVerificado = tempoAtual;
}

async function fecharESalvarSegmento(tempoFim) {
  if (tempoInicioSegmento === null || tempoInicioSegmento === tempoFim) return;

  const segmento = {
    start: tempoInicioSegmento,
    end: tempoFim
  };

  console.log("💾 [DB] Tentando salvar no Supabase:", segmento);

  tempoInicioSegmento = null;

  const { error } = await supabase
    .from('progress_segments')
    .insert({
      user_id: window.user_id,
      course_id: window.course_id,
      lesson_id: window.aulaAtual.id,
      duration: window.duration || 0,
      segment: segmento
    });

  if (error) {
    console.error("❌ [DB] Erro Crítico ao salvar:", error.message, error.details);
  } else {
    console.log("✅ [DB] Segmento salvo com sucesso!");
    await carregarProgressoCurso(supabase, window.user_id, window.course_id);
  }
}
