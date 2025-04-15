import { narrar, exibirMensagemAluno, mostrarNotificacao } from './narrativa.js';
import { atualizarIndicadorLocal } from './trackProgress.js';
import { habilitarQuiz } from './habilitarQuiz.js';
import { initPlayer } from './initPlayer.js';

export async function selecionarAula(aula, user_id) {
  window.maiorTempoVisualizado = 0;
  window.lastTime = 0;
  window._tempoInicioAguardoProgresso = null;
  window._erroAtrasoProgressoNarrado = false;
  window.progressoIniciado = false;

  narrar(`📥 Aula selecionada: "${aula.title}" (ID: ${aula.id})`, "info");
  window.aulaAtual = aula;

  document.getElementById("tituloAula").textContent = aula.title;
  document.getElementById("mensagemAluno").textContent = "";
  document.getElementById("mensagemAluno").className = "";
  document.getElementById("recomecarSugestao").innerHTML = "";
  document.getElementById("indicadorNumerico").textContent = "";

  const progressoEl = document.getElementById("progressoTexto");
  if (progressoEl) progressoEl.innerHTML = "⏳ Carregando progresso...";

  window.pontoRetomada = null;

  const btnQuiz = document.getElementById("btnQuiz");
  if (btnQuiz) {
    btnQuiz.disabled = true;
    btnQuiz.textContent = "Fazer Avaliação da Aula";
    btnQuiz.className = "bg-gray-300 text-gray-500 px-4 py-2 rounded text-sm cursor-not-allowed";
    btnQuiz.onclick = null;
  }

  if (window.interval) {
    clearInterval(window.interval);
    window.narrativaCiclosExecutados = 0;
    narrar("🛑 Limpando ciclo anterior de rastreamento.", "info");
  }

  const { data: progresso } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
    p_user_id: user_id,
    p_lesson_id: aula.id
  });

  if (progresso?.length > 0) {
    const dados = progresso[0];

    if (dados.segundos_assistidos > 0) {
      lastTime = dados.segundos_assistidos;
      maiorTempoVisualizado = dados.segundos_assistidos;
      aula.progressoRestaurado = true;
      narrar(`📥 Progresso recuperado: ${dados.segundos_assistidos}s`, "success");
    }

    if (dados.status === '✔ Concluída') {
      progressoEl.textContent = "✅ Aula concluída";
      document.getElementById("recomecarSugestao").innerHTML = "";
      await habilitarQuiz(aula.id, user_id);
    } else {
      atualizarIndicadorLocal(dados.segundos_assistidos, dados.duracao_total);

      pontoRetomada = Math.max(0, dados.segundos_assistidos - 15);
      const minutos = Math.floor(pontoRetomada / 60);
      const segundos = pontoRetomada % 60;
      const retomadaLabel = `${minutos}m${segundos.toString().padStart(2, '0')}s`;

      const link = document.createElement('div');
      link.className = 'mt-2 text-sm text-blue-600 underline cursor-pointer hover:text-blue-800 transition flex items-center gap-1';
      link.innerHTML = `🔁 Retomar de <strong>${retomadaLabel}</strong>`;
      link.onclick = () => {
        if (!window.player || typeof player.seekTo !== 'function') return;
        mostrarNotificacao(`⏩ Pulando para ${retomadaLabel}...`);
        player.seekTo(pontoRetomada, true);
        setTimeout(() => player.playVideo?.(), 500);
      };

      document.getElementById("recomecarSugestao").appendChild(link);
    }
  } else {
    atualizarIndicadorLocal(0, aula.duration);
  }

  initPlayer();
  progressoIniciado = false;

  window.timeoutProgressoInicial = setTimeout(() => {
    if (!progressoIniciado) {
      narrar("⚠️ Nenhum progresso detectado após 10s. Reproduza o vídeo para iniciar rastreamento.", "warning");
    }
  }, 10000);
}
