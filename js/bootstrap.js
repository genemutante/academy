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
import { verificarLoginObrigatorio, logout, salvarSessao } from './auth.js';

window.supabase = supabase;

// 📦 Exporta funções globais (opcional)
Object.assign(window, {
  trackProgress,
  verificarQuizRespondido,
  carregarDados,
  selecionarAula,
  habilitarQuiz,
  narrar,
  exibirMensagemAluno,
  initPlayer,
  onPlayerReady,
  verificarConclusaoAula,
  carregarProgressoCurso
});

// 🔁 Exibe botão da narrativa
//window.addEventListener('DOMContentLoaded', () => {
//  const btn = document.getElementById('abrirPainelBtn');
//  if (btn) {
//    btn.classList.remove('hidden');
//    setTimeout(() => btn.classList.add('hidden'), 10000);
//  }
//});

// 🚀 Execução principal da tela de curso
document.addEventListener("DOMContentLoaded", async () => {
  console.log("📦 Iniciando verificação de sessão...");

  const sessao = await verificarLoginObrigatorio();
  if (!sessao) return;

  const user_id = sessao.userId;
  const user_name = sessao.userName;
  const course_id = new URL(location.href).searchParams.get('course_id');

  if (!course_id) {
    narrar("❌ Nenhum course_id fornecido na URL.", "error");
    return;
  }

  // 🔗 Disponibiliza globalmente se necessário
  window.user_id = user_id;
  window.course_id = course_id;

  console.log("✅ Sessão ativa:", { user_id, user_name });
  console.log("📚 course_id da URL:", course_id);

  try {
    const el = document.getElementById('nomeAluno');
    if (el) el.textContent = user_name;

    const aulasRef = { value: [] };
    await carregarDados(user_id, course_id, aulasRef);

    carregarProgressoCurso?.(supabase, user_id, course_id);
  } catch (err) {
    console.error("❌ Erro ao carregar dados iniciais:", err);
    alert("Erro ao carregar o curso. Tente recarregar a página.");
  }
});

// ✅ Exportações
export {
  supabase,
  verificarLoginObrigatorio,
  logout,
  salvarSessao
};
