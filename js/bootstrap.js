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
import { carregarProgressoCurso } from './carregarProgressoCurso.js';

import { supabase } from './supabaseClient.js';

window.supabase = supabase;

// 🌐 Params da URL
const url = new URL(location.href);
window.user_id = url.searchParams.get('user_id');
window.course_id = url.searchParams.get('course_id');

// ✅ Funções de sessão reutilizáveis
export async function salvarSessao({ id, name }) {
  localStorage.setItem('user_id', id);
  localStorage.setItem('user_name', name);
}

export async function verificarLoginObrigatorio() {
  const userId = localStorage.getItem('user_id');
  const userName = localStorage.getItem('user_name');

  if (!userId || !userName) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
    return null;
  }

  return { userId, userName };
}

export async function logout() {
  try {
    await supabase.auth.signOut(); // caso use autenticação Supabase
  } catch (e) {
    console.warn("Erro ao fazer logout:", e);
  }

  localStorage.clear();
  sessionStorage.clear();
  window.location.href = '/';
}

// 📦 Exporta funções globais para o navegador (facultativo)
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
window.carregarProgressoCurso = carregarProgressoCurso;

// 🔁 Mostra botão flutuante da narrativa (opcional)
window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('abrirPainelBtn');
  if (btn) {
    btn.classList.remove('hidden');
    setTimeout(() => btn.classList.add('hidden'), 10000);
  }
});

// 🚀 Execução principal (condicional, se estiver na tela de curso)
document.addEventListener("DOMContentLoaded", async () => {
  if (!window.user_id || !window.course_id) return;

  try {
    const { data: user } = await supabase
      .from('users')
      .select('name')
      .eq('id', window.user_id)
      .single();

    if (user) {
      const el = document.getElementById('nomeAluno');
      if (el) el.textContent = user.name;
    }

    const aulasRef = { value: [] };
    await carregarDados(window.user_id, window.course_id, aulasRef);

    carregarProgressoCurso?.();
  } catch (err) {
    console.error("❌ Erro ao inicializar aplicativo:", err);
    alert("Erro ao carregar dados iniciais. Tente recarregar a página.");
  }
});

export { supabase };

