// aulaService.js

import { supabase } from './supabaseClient.js';

export async function carregarNomeAluno() {
  const url = new URL(location.href);
  const user_id = url.searchParams.get('user_id');
  const { data: user } = await supabase.from('users').select('name').eq('id', user_id).single();
  if (user) {
    document.getElementById('nomeAluno').textContent = user.name;
  }
}

export async function carregarDados() {
  const url = new URL(location.href);
  const user_id = url.searchParams.get('user_id');
  const course_id = url.searchParams.get('course_id');

  const tituloCurso = document.getElementById('tituloCurso');
  const descricaoCurso = document.getElementById('descricaoCurso');
  const listaAulas = document.getElementById('listaAulas');
  const barraProgresso = document.getElementById('barraProgresso');
  const textoProgresso = document.getElementById('textoProgresso');

  const { data: curso } = await supabase
    .from('courses')
    .select('*')
    .eq('id', course_id)
    .single();

  tituloCurso.textContent = curso.title;
  descricaoCurso.textContent = curso.description;

  const { data: aulas } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', course_id)
    .order('order');

  // Aqui você pode armazenar aulas no sessionStorage/localStorage se quiser reutilizar
  window.__AULAS__ = aulas || [];

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
  carregarProgressoCurso();
}

// Os métodos listarAulas, selecionarAula e carregarProgressoCurso
// ficarão em arquivos separados ou aqui mesmo, conforme a estratégia modular.
