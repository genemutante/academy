import { mostrarNotificacao, atualizarIndicadorLocal } from './utils.js';
import { habilitarQuiz } from './habilitarQuiz.js';
import { initPlayer } from './initPlayer.js';
import { narrar } from './narrativa.js';
import { supabase } from './supabaseClient.js';

// 🔁 Aguarda o elemento existir no DOM antes de executar a ação
function esperarElemento(id, callback) {
  const el = document.getElementById(id);
  if (el) return callback(el);

  const observer = new MutationObserver(() => {
    const el = document.getElementById(id);
    if (el) {
      observer.disconnect();
      callback(el);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

export async function selecionarAula(aula, user_id) {
  console.groupCollapsed(`🧭 [selecionarAula] Início - Aula: "${aula.title}" | ID: ${aula.id}`);

  window.user_id = user_id; // 🔐 Garante compatibilidade com outras funções
  window.aulaAtual = aula;
  window.maiorTempoVisualizado = 0;
  window.lastTime = 0;
  window._tempoInicioAguardoProgresso = null;
  window._erroAtrasoProgressoNarrado = false;
  window.progressoIniciado = false;

  narrar(`📥 Aula selecionada: "${aula.title}" (ID: ${aula.id})`, "info");

  // UI: espera elementos e atualiza
  esperarElemento("tituloAula", el => el.textContent = aula.title);
  esperarElemento("mensagemAluno", el => {
    el.textContent = "";
    el.className = "";
  });
  esperarElemento("recomecarSugestao", el => el.innerHTML = "");
  esperarElemento("indicadorNumerico", el => el.textContent = "");
  esperarElemento("progressoTexto", el => el.innerHTML = "⏳ Carregando progresso...");

  window.pontoRetomada = null;

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

  console.log("📌 [selecionarAula] Chamando Supabase RPC com:", {
    user_id,
    lesson_id: aula.id
  });

  const { data: progresso } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
    p_user_id: user_id,
    p_lesson_id: aula.id
  });

  const dados = progresso?.[0] || null;
  console.log("📦 Dados de progresso recebidos:", dados);

  if (dados) {
    aula.status = dados.status;
    window.aulaAtual.status = dados.status;
    console.log(`📌 Status atual da aula: ${dados.status}`);

    if (dados.status === '✔ Concluída') {
      console.log("✅ Aula já marcada como concluída. Atualizando UI e habilitando quiz...");
      
      atualizarIndicadorLocal(dados.segundos_assistidos, dados.duracao_total);
      esperarElemento("progressoTexto", el => el.textContent = "✅ Aula concluída");
      esperarElemento("recomecarSugestao", el => el.innerHTML = "");
      esperarElemento("indicadorNumerico", el => el.textContent = "");
      
      await habilitarQuiz(aula.id, user_id);
      console.log("🎬 Recarregando player mesmo com aula concluída");
      initPlayer(); // ✅ chama player normalmente
      
      console.groupEnd();
      return;
    }

    if (dados.segundos_assistidos > 0) {
      console.log(`⏪ Aula com progresso. Restaurando ponto: ${dados.segundos_assistidos}s`);
      window.lastTime = dados.segundos_assistidos;
      window.maiorTempoVisualizado = dados.segundos_assistidos;
      window.pontoRetomada = Math.max(0, dados.segundos_assistidos - 15);
      atualizarIndicadorLocal(dados.segundos_assistidos, dados.duracao_total);

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

      esperarElemento("recomecarSugestao", el => el.appendChild(link));
    } else {
      console.log("🆕 Nenhum segundo assistido anteriormente.");
    }

  } else {
    console.warn("🚫 Nenhum dado de progresso encontrado. Iniciando do zero.");
    atualizarIndicadorLocal(0, aula.duration);
  }

  // 🎬 Player
  console.log("🎬 Iniciando player...");
  initPlayer();
  window.progressoIniciado = false;

  window.timeoutProgressoInicial = setTimeout(() => {
    if (!window.progressoIniciado) {
      narrar("⚠️ Nenhum progresso detectado após 10s. Reproduza o vídeo para iniciar rastreamento.", "warning");
    }
  }, 10000);

  console.groupEnd();
}
