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

// 🚀 Execução principal da tela de curso

document.addEventListener("DOMContentLoaded", async () => {
  console.log("📦 Iniciando verificação de sessão...");

  const sessao = await verificarLoginObrigatorio();
  if (!sessao) return;

  const user_id = sessao.userId;
  const user_name = sessao.userName;
  let course_id = new URL(location.href).searchParams.get('course_id');

  // 🔁 Caso esteja dentro de iframe e ainda não tenha course_id
  if (!course_id) {
    console.warn("⏳ Aguardando course_id via postMessage...");

    window.addEventListener("message", async (event) => {
      const { tipo, dados } = event.data || {};
      if (tipo === "curso" && dados?.courseId) {
        course_id = dados.courseId;
        window.course_id = course_id;
        window.user_id = user_id;
        window.user_name = user_name;

        // Atualiza a URL virtualmente
        const novaUrl = new URL(location.href);
        novaUrl.searchParams.set("course_id", course_id);
        history.replaceState({}, "", novaUrl);

        const el = document.getElementById('nomeAluno');
        if (el) el.textContent = user_name;

        const aulasRef = { value: [] };
        await carregarDados(user_id, course_id, aulasRef);
        carregarProgressoCurso?.(supabase, user_id, course_id);
      }
    });

    return;
  }

  // 🔗 Disponibiliza globalmente
  window.user_id = user_id;
  window.course_id = course_id;
  window.user_name = user_name;

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


// 🔄 Garante que a função esteja globalmente disponível mesmo com type="module"
window.carregarProgressoCurso = carregarProgressoCurso;


