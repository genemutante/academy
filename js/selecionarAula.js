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
    if (el) {
      observer.disconnect();
      callback(el);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

export async function selecionarAula(aula, user_id) {
  // --- AJUSTE CIRÚRGICO: LIMPEZA DE ESTADO ANTERIOR ---
  if (window.interval) {
    clearInterval(window.interval);
    console.log("🧹 Intervalo de rastreamento anterior limpo.");
  }
  
  if (window.timeoutProgressoInicial) {
    clearTimeout(window.timeoutProgressoInicial);
  }

  console.groupCollapsed(`🧭 [selecionarAula] Início - Aula: "${aula.title}" | ID: ${aula.id}`);

  // Configuração de variáveis globais de controle
  window.user_id = user_id;
  window.aulaAtual = aula;
  window.maiorTempoVisualizado = 0;
  window.lastTime = 0;
  window.progressoIniciado = false;
  window.aulaFinalizada = false; // 🔓 Reset essencial para nova aula
  window._erroAtrasoProgressoNarrado = false;

  narrar(`📥 Aula selecionada: "${aula.title}" (ID: ${aula.id})`, "info");

  // Atualização da Interface
  esperarElemento("tituloAula", el => el.textContent = aula.title);
  esperarElemento("mensagemAluno", el => {
    el.textContent = "Carregando aula...";
    el.className = "text-gray-500 text-sm italic";
  });

  // 1. Buscar Progresso no Banco (Supabase)
  console.log("🔍 Buscando progresso salvo...");
  const { data: progresso, error } = await supabase
    .from('user_progress')
    .select('last_time')
    .eq('user_id', user_id)
    .eq('lesson_id', aula.id)
    .maybeSingle();

  if (error) {
    console.error("❌ Erro ao buscar progresso:", error);
  }

  // 2. Lógica de Retomada
  if (progresso && progresso.last_time > 0) {
    window.pontoRetomada = progresso.last_time;
    window.maiorTempoVisualizado = progresso.last_time;
    window.lastTime = progresso.last_time;
    
    console.log(`📍 Ponto de retomada encontrado: ${window.pontoRetomada}s`);

    if (aula.status !== '✔ Concluída') {
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

      esperarElemento("recomecarSugestao", el => {
        el.innerHTML = ""; // Limpa sugestões anteriores
        el.appendChild(link);
      });
    }
  } else {
    console.warn("🚫 Nenhum progresso prévio. Iniciando do zero.");
    atualizarIndicadorLocal(0, aula.duration);
    esperarElemento("recomecarSugestao", el => el.innerHTML = "");
  }

  // 3. Inicialização do Player
  console.log("🎬 Iniciando player...");
  initPlayer();

  // Monitor de segurança para garantir que o rastreamento comece
  window.timeoutProgressoInicial = setTimeout(() => {
    if (!window.progressoIniciado && !window.aulaFinalizada) {
      narrar("⚠️ O rastreamento de progresso ainda não iniciou. Verifique se o vídeo deu play.", "warning");
    }
  }, 10000);

  console.groupEnd();
}

// Expõe para o escopo global para compatibilidade com scripts legados se necessário
window.selecionarAula = selecionarAula;
