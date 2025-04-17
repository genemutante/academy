// bootstrap.js

import { trackProgress } from './trackProgress.js';
import { verificarQuizRespondido } from './verificarQuizRespondido.js';
import { carregarDados } from './carregarDados.js';
import { selecionarAula } from './selecionarAula.js';
import { habilitarQuiz } from './habilitarQuiz.js';
import { narrar, exibirMensagemAluno } from './narrativa.js';
import { initPlayer } from './initPlayer.js';
import { onPlayerReady } from './onPlayerReady.js';
import { verificarConclusaoAula } from './verificarConclusaoAula.js';
import { carregarProgressoCurso } from './carregarProgressoCurso.js'; // ✅ novo

import { supabase } from './supabaseClient.js';
import { verificarLoginObrigatorio, logout } from './auth.js';

window.supabase = supabase;

// 🌐 Params da URL
const url = new URL(location.href);
window.user_id = url.searchParams.get('user_id');
window.course_id = url.searchParams.get('course_id');

// 📦 Exporta funções globais
window.trackProgress = trackProgress;
window.verificarQuizRespondido = verificarQuizRespondido;
window.carregarDados = carregarDados;
window.selecionarAula = selecionarAula;
window.habilitarQuiz = habilitarQuiz;
window.narrar = narrar;
window.exibirMensagemAluno = exibirMensagemAluno;
window.initPlayer = initPlayer;
window.onPlayerReady = onPlayerReady;
window.verificarConclusaoAula = verificarConclusaoAula;
window.carregarProgressoCurso = carregarProgressoCurso; // ✅ novo

// 🔁 Mostra botão flutuante da narrativa brevemente ao carregar
window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('abrirPainelBtn');

  if (btn) {
    btn.classList.remove('hidden');
    setTimeout(() => {
      btn.classList.add('hidden');
    }, 10000);
  }
});

// 🚀 Execução principal
document.addEventListener("DOMContentLoaded", async () => {
  const sessao = await verificarLoginObrigatorio();
  if (!sessao) return;

  // Atualiza nome global
  window.user_id = sessao.userId;
  window.nomeAluno = sessao.userName;

  // Atualiza nome no cabeçalho, se o elemento existir
  const nomeSpan = document.getElementById('nomeAluno');
  if (nomeSpan) {
    nomeSpan.textContent = `👤 ${sessao.userName}`;
  }

  // Ativa botão de logout, se presente
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  try {
    const { data: user } = await window.supabase
      .from('users')
      .select('name')
      .eq('id', window.user_id)
      .single();

    if (user) {
      document.getElementById('nomeAluno').textContent = user.name;
    }

    const aulasRef = { value: [] };
    await window.carregarDados(window.user_id, window.course_id, aulasRef);

    // ✅ Atualiza progresso do curso após carregar aulas
    window.carregarProgressoCurso?.();

  } catch (err) {
    console.error("❌ Erro ao inicializar aplicativo:", err);
    alert("Erro ao carregar dados iniciais. Tente recarregar a página.");
  }
});
