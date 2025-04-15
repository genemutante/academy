import { narrar } from './narrativa.js';
import { selecionarAulaInicial } from './selecionarAulaInicial.js';
import { listarAulas } from './listarAulas.js';
import { carregarProgressoCurso } from './carregarProgressoCurso.js';
import { supabase } from './supabaseClient.js';


export async function carregarDados(user_id, course_id, aulasRef) {
  const { data: curso } = await supabase
    .from('courses')
    .select('*')
    .eq('id', course_id)
    .single();

  if (!curso) {
    narrar("❌ Falha ao carregar curso. Verifique o course_id ou conexão.", "error");
    document.getElementById("tituloCurso").textContent = "❌ Erro ao carregar curso";
    return;
  }

  document.getElementById("tituloCurso").textContent = curso.title;
  document.getElementById("descricaoCurso").textContent = curso.description;

  const { data: lista } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', course_id)
    .order('order');

  if (!lista || lista.length === 0) {
    narrar("⚠️ Nenhuma aula encontrada para este curso.", "warning");
    return;
  }

  let aulas = lista;

  const promises = aulas.map(async (aula) => {
    const { data: progresso, error } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
      p_user_id: user_id,
      p_lesson_id: aula.id
    });

    if (error) {
      narrar(`❌ Erro ao consultar progresso da aula "${aula.title}": ${error.message}`, "error");
    }

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
  aulasRef.value = aulas; // atualiza referência global

  listarAulas(aulas, user_id);
  requestAnimationFrame(() => selecionarAulaInicial(aulas, user_id));
  carregarProgressoCurso(supabase, user_id, course_id);
}
