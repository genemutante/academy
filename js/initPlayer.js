import { getYouTubeId, atualizarIndicadorLocal } from './utils.js'; 
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

    // Ajuste: O fim do segmento DEVE ser a duração total para o SQL validar 100%
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
        
        // Atualiza variáveis globais para o valor máximo
        window.maiorTempoVisualizado = duration;
        window.pontoRetomada = duration;
        window.aulaFinalizada = true;
        
        // Força a UI a mostrar 100% imediatamente
        atualizarIndicadorLocal(duration, duration);
        
        await finalizarAulaCompletamente();
      }
    } catch (e) {
      console.error("❌ Falha na comunicação:", e);
    }
  }
}

async function finalizarAulaCompletamente() {
  try {
    if (typeof trackProgress === 'function') await trackProgress(); 

    const { data: progressoAtualizado } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
      p_user_id: window.user_id,
      p_lesson_id: window.aulaAtual.id
    });

    const dados = progressoAtualizado?.[0];
    const aulaFinalizada = dados?.status === '✔ Concluída';
    
    // Passa o ID da aula corretamente (evita o erro do "false")
    const quizRespondido = await verificarQuizRespondido(window.user_id, window.aulaAtual.id);

    if (aulaFinalizada) {
      const progressoEl = document.getElementById("progressoTexto");
      const sugestaoEl = document.getElementById("recomecarSugestao");
      const msgEl = document.getElementById("mensagemAluno");
      
      if (progressoEl) progressoEl.textContent = "✅ Aula concluída";
      if (sugestaoEl) sugestaoEl.innerHTML = "";
      if (msgEl) {
          msgEl.textContent = "✅ Aula finalizada! Responda o quiz abaixo.";
          msgEl.className = "text-green-600 font-bold";
      }

      await habilitarQuiz(window.aulaAtual.id);
      
      // Chamadas protegidas
      try { if (typeof listarAulas === 'function') listarAulas(); } catch (e) {}
      try { if (typeof carregarProgressoCurso === 'function') carregarProgressoCurso(); } catch (e) {}

      if (quizRespondido) {
        // Busca as aulas da variável global ou tenta recuperar se estiver undefined
        const listaDeAulas = window.aulas || [];
        const atualIndex = listaDeAulas.findIndex(a => a.id === window.aulaAtual.id);
        const proxima = listaDeAulas[atualIndex + 1];
        
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
