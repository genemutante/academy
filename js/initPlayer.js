import { getYouTubeId } from './utils.js'; 
import { onPlayerReady } from './onPlayerReady.js';
import { verificarQuizRespondido } from './verificarQuizRespondido.js';
import { habilitarQuiz } from './habilitarQuiz.js';
import { listarAulas } from './listarAulas.js';
import { carregarProgressoCurso } from './carregarProgressoCurso.js';
import { mostrarTransicaoParaProximaAula } from './mostrarTransicaoParaProximaAula.js';
import { narrar, exibirMensagemAluno } from './narrativa.js';
import { supabase } from './supabaseClient.js';
import { trackProgress } from './trackProgress.js';

export function loadYouTubeAPI() {
  return new Promise(resolve => {
    if (window.YT && window.YT.Player) return resolve();
    window.onYouTubeIframeAPIReady = resolve;
  });
}

export async function initPlayer() {
  if (window.player && typeof window.player.destroy === 'function') {
    window.player.destroy();
    window.player = null;
    const container = document.getElementById('videoPlayer');
    if (container) container.innerHTML = '';
  }

  const videoId = getYouTubeId(window.aulaAtual.youtube_url);
  if (!videoId) return;

  await loadYouTubeAPI();

  window.player = new YT.Player('videoPlayer', {
    videoId,
    playerVars: {
      autoplay: 1,
      modestbranding: 1,
      rel: 0,
      origin: window.location.origin
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange 
    }
  });
}

async function onPlayerStateChange(event) {
  // YT.PlayerState.ENDED = 0
  if (event.data === YT.PlayerState.ENDED) {
    console.log("🏁 Vídeo finalizado! Forçando gravação no banco...");
    
    const duration = Math.floor(event.target.getDuration());
    const userId = window.user_id;
    const lessonId = window.aulaAtual.id;
    const courseId = window.aulaAtual.course_id;

    const inicioSegmentoFinal = window.maiorTempoVisualizado || (duration - 5);

    try {
      const { error } = await supabase
        .from('progress_segments')
        .insert([
          {
            user_id: userId,
            lesson_id: lessonId,
            course_id: courseId,
            duration: duration,
            segment: { start: inicioSegmentoFinal, end: duration } 
          }
        ]);

      if (error) {
        console.error("❌ Erro ao gravar progresso final:", error.message);
      } else {
        console.log("✅ Checkpoint final gravado com sucesso!");
        window.maiorTempoVisualizado = duration;
        window.pontoRetomada = duration;
        window.aulaFinalizada = true; // Marca como finalizada globalmente
        
        // Chamada segura para finalização
        await finalizarAulaCompletamente();
      }
    } catch (e) {
      console.error("❌ Falha na comunicação:", e);
    }
  }
}

async function finalizarAulaCompletamente() {
  try {
    // Tenta executar o trackProgress uma última vez
    if (typeof trackProgress === 'function') await trackProgress(); 

    const { data: progressoAtualizado } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
      p_user_id: window.user_id,
      p_lesson_id: window.aulaAtual.id
    });

    const dados = progressoAtualizado?.[0];
    const aulaFinalizada = dados?.status === '✔ Concluída';
    
    // Verifica quiz
    const quizRespondido = await verificarQuizRespondido(window.user_id, window.aulaAtual.id);

    if (aulaFinalizada) {
      const progressoEl = document.getElementById("progressoTexto");
      const sugestaoEl = document.getElementById("recomecarSugestao");
      
      if (progressoEl) progressoEl.textContent = "✅ Aula concluída";
      if (sugestaoEl) sugestaoEl.innerHTML = "";

      await habilitarQuiz(window.aulaAtual.id);
      
      // Chamadas protegidas (Se as funções falharem, o código não trava mais)
      try { if (typeof listarAulas === 'function') listarAulas(); } catch (e) { console.warn("Aviso: Falha ao atualizar lista lateral."); }
      try { if (typeof carregarProgressoCurso === 'function') carregarProgressoCurso(); } catch (e) { console.warn("Aviso: Falha ao atualizar progresso do curso."); }

      if (quizRespondido) {
        const aulas = window.aulas || [];
        const atualIndex = aulas.findIndex(a => a.id === window.aulaAtual.id);
        const proxima = aulas[atualIndex + 1];
        if (proxima && typeof mostrarTransicaoParaProximaAula === 'function') {
          mostrarTransicaoParaProximaAula(proxima, window.selecionarAula);
        }
      } else {
        narrar("📋 Aula concluída! Responda o quiz para avançar.", "warning");
      }
    }
  } catch (err) {
    console.error("❌ Erro interno no fluxo de finalização:", err);
  }
}
