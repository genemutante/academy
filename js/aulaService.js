import { supabase } from './supabaseClient.js';
import { listarAulas, selecionarAula } from './player.js';

export async function carregarDados(user_id, course_id, barraProgresso, textoProgresso) {
  const { data: curso } = await supabase
    .from('courses')
    .select('*')
    .eq('id', course_id)
    .single();

  document.getElementById('tituloCurso').textContent = curso.title;
  document.getElementById('descricaoCurso').textContent = curso.description;

  const { data: lista } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', course_id)
    .order('order');

  window.__AULAS__ = lista || [];

  const promises = window.__AULAS__.map(async (aula) => {
    const { data: progresso } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
      p_user_id: user_id,
      p_lesson_id: aula.id
    });

    aula.status = progresso?.[0]?.status || '🚫 Não Iniciada';

    const { data: quiz } = await supabase
      .from('user_quiz_results')
      .select('id')
      .eq('user_id', user_id)
      .eq('lesson_id', aula.id)
      .limit(1);

    aula.quizEnviado = !!(quiz && quiz.length > 0);
    return aula;
  });

  window.__AULAS__ = await Promise.all(promises);
  listarAulas();
  if (window.__AULAS__.length) selecionarAula(window.__AULAS__[0]);

  await carregarProgressoCurso(user_id, course_id, barraProgresso, textoProgresso);
}

export async function carregarProgressoCurso(user_id, course_id, barraProgresso, textoProgresso) {
  const { data } = await supabase.rpc('fn_progresso_curso_por_usuario', {
    p_user_id: user_id,
    p_course_id: course_id
  });

  if (data?.length > 0) {
    const pct = data[0].percentual_conclusao || 0;
    barraProgresso.style.width = pct + '%';
    textoProgresso.textContent = pct + '%';
  }
}
