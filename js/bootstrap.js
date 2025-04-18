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
import { verificarLoginObrigatorio, logout, salvarSessao } from './auth.js'; // ✅ Centralizado

window.supabase = supabase;

// 🌐 Params da URL (se necessários em algumas páginas)
const url = new URL(location.href);
window.user_id = url.searchParams.get('user_id');
window.course_id = url.searchParams.get('course_id');

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

// 🚀 Execução principal (somente se URL tiver user_id e course_id)
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

// ✅ Exportações limpas
export {
  supabase,
  verificarLoginObrigatorio,
  logout,
  salvarSessao
};
