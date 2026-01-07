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
// Dentro do initPlayer.js

async function onPlayerStateChange(event) {
  // YT.PlayerState.ENDED = 0
  if (event.data === YT.PlayerState.ENDED) {
    console.log("🏁 Vídeo finalizado! Forçando gravação no banco...");
    
    const duration = Math.floor(event.target.getDuration());
    const userId = window.user_id;
    const lessonId = window.aulaAtual.id;

    // Criamos um segmento pequeno que "fecha" o vídeo (ex: do 478 ao 483)
    // Usamos o maiorTempoVisualizado como início para garantir continuidade
    const inicioSegmentoFinal = window.maiorTempoVisualizado || (duration - 5);

    try {
      const { error } = await supabase
        .from('progress_segments')
        .insert([
          {
            user_id: userId,
            lesson_id: lessonId,
            // Importante: o objeto segment deve bater com o que sua função espera
            segment: { start: inicioSegmentoFinal, end: duration } 
          }
        ]);

      if (error) {
        console.error("❌ Erro ao gravar progresso final:", error.message);
      } else {
        console.log("✅ Checkpoint final gravado com sucesso no banco!");
        // Após gravar, atualizamos a UI e as variáveis globais
        window.maiorTempoVisualizado = duration;
        window.pontoRetomada = duration;
        
        // Executa a lógica de conclusão (liberar quiz, transição, etc)
        await finalizarAulaCompletamente();
      }
    } catch (e) {
      console.error("❌ Falha na comunicação com o banco:", e);
    }
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
