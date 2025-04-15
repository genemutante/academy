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
    document.getElementById('videoPlayer').innerHTML = '';
    narrar("♻️ Player anterior destruído e DOM limpo.", "info");
  }

  const videoId = getYouTubeId(window.aulaAtual.youtube_url);
  if (!videoId) {
    narrar("❌ Erro: vídeo do YouTube não encontrado para esta aula.", "error");
    return;
  }

  await loadYouTubeAPI();

  window.player = new YT.Player('videoPlayer', {
    videoId,
    playerVars: {
      origin: location.origin,
      enablejsapi: 1,
      modestbranding: 1,
      rel: 0,
      controls: 1,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      showinfo: 0
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: async (event) => {
        if (event.data === YT.PlayerState.ENDED) {
          console.log("🏁 Vídeo finalizado!");
          await trackProgress();

          const { data: progressoAtualizado } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
            p_user_id: window.user_id,
            p_lesson_id: window.aulaAtual.id
          });

          const aulaFinalizada = progressoAtualizado?.[0]?.status === '✔ Concluída';
          const quizRespondido = await verificarQuizRespondido(window.user_id, window.aulaAtual.id);

          if (aulaFinalizada && quizRespondido) {
            document.getElementById("progressoTexto").textContent = "✅ Aula concluída";
            document.getElementById("recomecarSugestao").innerHTML = "";

            await habilitarQuiz(window.aulaAtual.id);
            listarAulas();
            carregarProgressoCurso();

            const atualIndex = window.aulas.findIndex(a => a.id === window.aulaAtual.id);
            const proxima = window.aulas[atualIndex + 1];
            if (proxima) {
              mostrarTransicaoParaProximaAula(proxima);
            } else {
              exibirMensagemAluno("🏁 Fim do curso. Parabéns!", "success");
            }
          } else {
            narrar("⛔ Aula finalizada, mas avaliação pendente. Não avançará automaticamente.", "warning");
            exibirMensagemAluno("📋 Aula assistida! Responda a avaliação para avançar.", "warning");
          }
        }
      }
    }
  });
}
