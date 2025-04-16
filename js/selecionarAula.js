import { mostrarNotificacao, atualizarIndicadorLocal } from './utils.js';
import { habilitarQuiz } from './habilitarQuiz.js';
import { initPlayer } from './initPlayer.js';
import { narrar } from './narrativa.js';
import { supabase } from './supabaseClient.js';

export async function selecionarAula(aula, user_id) {
  // Reset globals
  window.aulaAtual = aula;
  window.maiorTempoVisualizado = 0;
  window.lastTime = 0;
  window._tempoInicioAguardoProgresso = null;
  window._erroAtrasoProgressoNarrado = false;
  window.progressoIniciado = false;

  narrar(`📥 Aula selecionada: "${aula.title}" (ID: ${aula.id})`, "info");

  // Atualiza UI
  document.getElementById("tituloAula").textContent = aula.title;
  document.getElementById("mensagemAluno").textContent = "";
  document.getElementById("mensagemAluno").className = "";
  document.getElementById("recomecarSugestao").innerHTML = "";
  document.getElementById("indicadorNumerico").textContent = "";
  const progressoEl = document.getElementById("progressoTexto");
  if (progressoEl) progressoEl.innerHTML = "⏳ Carregando progresso...";

  window.pontoRetomada = null;

  // Reset botão de quiz
  const btnQuiz = document.getElementById("btnQuiz");
  if (btnQuiz) {
    btnQuiz.disabled = true;
    btnQuiz.textContent = "Fazer Avaliação da Aula";
    btnQuiz.className = "bg-gray-300 text-gray-500 px-4 py-2 rounded text-sm cursor-not-allowed";
    btnQuiz.onclick = null;
  }

  // Limpa rastreamento anterior
  if (window.interval) {
    clearInterval(window.interval);
    window.narrativaCiclosExecutados = 0;
    narrar("🛑 Limpando ciclo anterior de rastreamento.", "info");
  }

  // 🔍 Consulta progresso no Supabase
  const { data: progresso } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
    p_user_id: user_id,
    p_lesson_id: aula.id
  });


  
  if (progresso?.length > 0) {
    const dados = progresso[0];

    if (dados.segundos_assistidos > 0) {
      window.lastTime = dados.segundos_assistidos;
      window.maiorTempoVisualizado = dados.segundos_assistidos;
      aula.progressoRestaurado = true;
      narrar(`📥 Progresso recuperado: ${dados.segundos_assistidos}s`, "success");
    }

    if (dados.status === '✔ Concluída') {
      if (progressoEl) progressoEl.textContent = "✅ Aula concluída";
      document.getElementById("recomecarSugestao").innerHTML = "";
      await habilitarQuiz(aula.id, user_id);

     atualizarIndicadorLocal(dados.segundos_assistidos, dados.duracao_total);
      
    } else {
      atualizarIndicadorLocal(dados.segundos_assistidos, dados.duracao_total);
      window.pontoRetomada = Math.max(0, dados.segundos_assistidos - 15);

      const minutos = Math.floor(window.pontoRetomada / 60);
      const segundos = window.pontoRetomada % 60;
      const retomadaLabel = `${minutos}m${segundos.toString().padStart(2, '0')}s`;

      const link = document.createElement('div');
      link.className = 'mt-2 text-sm text-blue-600 underline cursor-pointer hover:text-blue-800 transition flex items-center gap-1';
      link.innerHTML = `🔁 Retomar de <strong>${retomadaLabel}</strong>`;
      link.onclick = () => {
        if (!window.player || typeof window.player.seekTo !== 'function') return;
        mostrarNotificacao(`⏩ Pulando para ${retomadaLabel}...`);
        window.player.seekTo(window.pontoRetomada, true);
        setTimeout(() => window.player.playVideo?.(), 500);
      };

      document.getElementById("recomecarSugestao").appendChild(link);
    }
  } else {
    atualizarIndicadorLocal(0, aula.duration);
  }

  // Inicializa player e começa rastreamento
  initPlayer();
  window.progressoIniciado = false;

  window.timeoutProgressoInicial = setTimeout(() => {
    if (!window.progressoIniciado) {
      narrar("⚠️ Nenhum progresso detectado após 10s. Reproduza o vídeo para iniciar rastreamento.", "warning");
    }
  }, 10000);
}
