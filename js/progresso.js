// progresso.js
import { supabase } from './supabaseClient.js';
import { atualizarIndicadorLocal, mostrarNotificacao } from './utils.js';
import { habilitarQuiz } from './quiz.js';
import { listarAulas } from './aulaService.js';

export function configurarProgresso() {
  // esse módulo pode expor funções reativas no futuro
}

export async function atualizarStatusAula(aula, tempoAtual, duracao) {
  const user_id = new URL(location.href).searchParams.get('user_id');

  const { data: progressoAtualizado, error } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
    p_user_id: user_id,
    p_lesson_id: aula.id
  });

  if (error || !progressoAtualizado?.length) return;

  const item = progressoAtualizado[0];
  aula.status = item.status;

  const progressoEl = document.getElementById("progressoTexto");
  const sugestaoEl = document.getElementById("recomecarSugestao");

  if (item.status === '✔ Concluída') {
    if (progressoEl) progressoEl.textContent = "✅ Aula concluída";
    if (sugestaoEl) sugestaoEl.innerHTML = "";
    await habilitarQuiz(aula.id);

    const indexAtual = window.__AULAS__.findIndex(a => a.id === aula.id);
    const proxima = window.__AULAS__[indexAtual + 1];

    if (proxima && proxima.status !== '✔ Concluída') {
      proxima.status = '🔓 Desbloqueada';
      listarAulas();
      mostrarNotificacao(`✅ Aula concluída! Próxima desbloqueada: ${proxima.title}`);
    }
  }

  await carregarProgressoCurso(user_id, aula.course_id);
  listarAulas();
}

export async function carregarProgressoCurso(user_id, course_id) {
  const { data } = await supabase.rpc('fn_progresso_curso_por_usuario', {
    p_user_id: user_id,
    p_course_id: course_id
  });

  if (data?.length > 0) {
    const pct = data[0].percentual_conclusao || 0;
    document.getElementById('barraProgresso').style.width = pct + '%';
    document.getElementById('textoProgresso').textContent = pct + '%';
  }
}
