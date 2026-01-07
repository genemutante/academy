import { mostrarNotificacao, atualizarIndicadorLocal } from './utils.js';
import { habilitarQuiz } from './habilitarQuiz.js';
import { initPlayer } from './initPlayer.js';
import { narrar } from './narrativa.js';
import { supabase } from './supabaseClient.js';

function esperarElemento(id, callback) {
  const el = document.getElementById(id);
  if (el) return callback(el);
  const observer = new MutationObserver(() => {
    const el = document.getElementById(id);
    if (el) { observer.disconnect(); callback(el); }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

export async function selecionarAula(aula, user_id) {
  console.groupCollapsed(`🧭 [selecionarAula] Iniciando: "${aula.title}"`);

  // Resets de estado global da aula
  window.user_id = user_id;
  window.aulaAtual = aula;
  window.maiorTempoVisualizado = 0;
  window.lastTime = 0;
  window.progressoIniciado = false;
  window.aulaFinalizada = false;

  narrar(`📥 Carregando conteúdo da aula: "${aula.title}"`, "info");

  // 1. Atualiza Interface
  esperarElemento("tituloAula", el => el.textContent = aula.title);
  esperarElemento("recomecarSugestao", el => el.innerHTML = ""); 

  // 2. Busca o último ponto de retomada nos segmentos salvos
  let pontoRetomada = 0;
  const { data: segmentos } = await supabase
    .from('progress_segments')
    .select('segment')
    .eq('user_id', user_id)
    .eq('lesson_id', aula.id);

  if (segmentos && segmentos.length > 0) {
    // Encontra o maior valor de 'end' entre todos os pedaços assistidos
    pontoRetomada = Math.max(...segmentos.map(s => s.segment.end));
    window.pontoRetomada = pontoRetomada;
    window.maiorTempoVisualizado = pontoRetomada;
  }

  // 3. Exibe botão de retomada se houver progresso significativo
  if (pontoRetomada > 5 && aula.status !== '✔ Concluída') {
    const min = Math.floor(pontoRetomada / 60);
    const seg = pontoRetomada % 60;
    const tempoLabel = `${min}m${seg.toString().padStart(2, '0')}s`;

    esperarElemento("recomecarSugestao", el => {
      const btn = document.createElement('div');
      btn.className = 'mt-2 text-sm text-blue-600 underline cursor-pointer hover:text-blue-800 transition flex items-center gap-1 font-bold';
      btn.innerHTML = `🔁 Você parou em ${tempoLabel}. Clique para continuar de onde parou.`;
      btn.onclick = () => {
        if (window.player?.seekTo) {
          window.player.seekTo(pontoRetomada, true);
          window.player.playVideo();
          btn.remove();
          mostrarNotificacao(`⏩ Retomando em ${tempoLabel}`);
        }
      };
      el.appendChild(btn);
    });
  }

  // 4. Verifica se deve habilitar o Quiz imediatamente
  if (aula.status === '✔ Concluída') {
    habilitarQuiz(aula.id);
  }

  // 5. Inicializa o Player do YouTube
  atualizarIndicadorLocal(pontoRetomada, aula.duration || 0);
  initPlayer();

  console.groupEnd();
}
