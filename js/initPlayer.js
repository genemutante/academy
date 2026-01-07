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

    // Define o início do último pedaço com base no que já foi visto
    const inicioSegmentoFinal = window.maiorTempoVisualizado || (duration - 5);

    try {
      // AJUSTE: Incluído 'duration' para satisfazer a restrição NOT NULL do banco
      const { error } = await supabase
        .from('progress_segments')
        .insert([
          {
            user_id: userId,
            lesson_id: lessonId,
            course_id: courseId,
            duration: duration, // <-- CORREÇÃO: Faltava este campo!
            segment: { start: inicioSegmentoFinal, end: duration } 
          }
        ]);

      if (error) {
        console.error("❌ Erro ao gravar progresso final:", error.message);
      } else {
        console.log("✅ Checkpoint final gravado com sucesso!");
        window.maiorTempoVisualizado = duration;
        window.pontoRetomada = duration;
        
        await finalizarAulaCompletamente();
      }
    } catch (e) {
      console.error("❌ Falha na comunicação:", e);
    }
  }
}

async function finalizarAulaCompletamente() {
  // Uma última execução do rastreador para garantir sincronia
  await trackProgress(); 

  const { data: progressoAtualizado } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
    p_user_id: window.user_id,
    p_lesson_id: window.aulaAtual.id
  });

  const dados = progressoAtualizado?.[0];
  const aulaFinalizada = dados?.status === '✔ Concluída';
  
  // Garantindo que passamos o ID da aula e não um booleano
  const quizRespondido = await verificarQuizRespondido(window.user_id, window.aulaAtual.id);

  if (aulaFinalizada) {
    const progressoEl = document.getElementById("progressoTexto");
    const sugestaoEl = document.getElementById("recomecarSugestao");
    
    if (progressoEl) progressoEl.textContent = "✅ Aula concluída";
    if (sugestaoEl) sugestaoEl.innerHTML = "";

    await habilitarQuiz(window.aulaAtual.id);
    
    if (typeof listarAulas === 'function') listarAulas();
    if (typeof carregarProgressoCurso === 'function') carregarProgressoCurso();

    if (quizRespondido) {
      const atualIndex = window.aulas?.findIndex(a => a.id === window.aulaAtual.id);
      const proxima = window.aulas?.[atualIndex + 1];
      if (proxima) {
        mostrarTransicaoParaProximaAula(proxima, window.selecionarAula);
      }
    } else {
      narrar("📋 Aula concluída! Responda o quiz para avançar.", "warning");
    }
  }
}
