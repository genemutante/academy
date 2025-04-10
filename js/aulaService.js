import { supabase } from './supabaseClient.js';
import { listarAulas } from './cursoService.js';
import { carregarProgressoCurso } from './progresso.js';

export async function carregarDados(user_id, course_id, selecionarAula) {
  const tituloCurso = document.getElementById('tituloCurso');
  const descricaoCurso = document.getElementById('descricaoCurso');
  const barraProgresso = document.getElementById('barraProgresso');
  const textoProgresso = document.getElementById('textoProgresso');

  const { data: curso } = await supabase
    .from('courses')
    .select('*')
    .eq('id', course_id)
    .single();

  tituloCurso.textContent = curso.title;
  descricaoCurso.textContent = curso.description;

  const { data: lista } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', course_id)
    .order('order');

  let aulas = lista || [];

  const promises = aulas.map(async (aula) => {
    const { data: progresso } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
      p_user_id: user_id,
      p_lesson_id: aula.id,
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

  aulas = await Promise.all(promises);

  window.__AULAS__ = aulas;

  listarAulas(aulas, selecionarAula);
  if (aulas.length) selecionarAula(aulas[0]);

  await carregarProgressoCurso(user_id, course_id, barraProgresso, textoProgresso);
}
