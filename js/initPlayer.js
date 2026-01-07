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
    narrar("♻️ Player anterior destruído.", "info");
  }

  const videoId = getYouTubeId(window.aulaAtual.youtube_url);
  if (!videoId) {
    narrar("❌ Erro: vídeo não encontrado.", "error");
    return;
  }

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
      onStateChange: onPlayerStateChange // <--- ADICIONADO: Captura mudança de estado
    }
  });
}

// NOVA FUNÇÃO: Força a conclusão quando o vídeo termina
async function onPlayerStateChange(event) {
  // YT.PlayerState.ENDED = 0 (Vídeo finalizado)
  if (event.data === YT.PlayerState.ENDED) {
    console.log("🏁 Vídeo finalizado! Forçando gravação do checkpoint final...");
    
    const duration = Math.floor(event.target.getDuration());
    
    // 1. Envia o último segmento cobrindo o final do vídeo
    // Usamos start = duration - 1 para garantir que o range cubra o fim
    await supabase.from('progress_segments').insert({
      user_id: window.user_id,
      lesson_id: window.aulaAtual.id,
      segment: { start: Math.max(0, duration - 5), end: duration }
    });

    // 2. Executa a lógica de conclusão que já existia no seu código original
    await finalizarAulaCompletamente();
  }
}

async function finalizarAulaCompletamente() {
  await trackProgress(); // Uma última execução do rastreador

  const { data: progressoAtualizado } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
    p_user_id: window.user_id,
    p_lesson_id: window.aulaAtual.id
  });

  const aulaFinalizada = progressoAtualizado?.[0]?.status === '✔ Concluída';
  const quizRespondido = await verificarQuizRespondido(window.user_id, window.aulaAtual.id);

  if (aulaFinalizada) {
    const progressoEl = document.getElementById("progressoTexto");
    const sugestaoEl = document.getElementById("recomecarSugestao");
    if (progressoEl) progressoEl.textContent = "✅ Aula concluída";
    if (sugestaoEl) sugestaoEl.innerHTML = "";

    await habilitarQuiz(window.aulaAtual.id);
    listarAulas();
    carregarProgressoCurso();

    if (quizRespondido) {
      const atualIndex = window.aulas.findIndex(a => a.id === window.aulaAtual.id);
      const proxima = window.aulas[atualIndex + 1];
      if (proxima) {
        mostrarTransicaoParaProximaAula(proxima, window.selecionarAula);
      } else {
        exibirMensagemAluno("🏁 Fim do curso. Parabéns!", "success");
      }
    } else {
      narrar("📋 Aula assistida! Responda a avaliação para avançar.", "warning");
      exibirMensagemAluno("📋 Aula assistida! Responda a avaliação para avançar.", "warning");
    }
  }
}
