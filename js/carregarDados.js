import { narrar } from './narrativa.js';
import { selecionarAulaInicial } from './selecionarAulaInicial.js';
import { listarAulas } from './listarAulas.js';
import { carregarProgressoCurso } from './carregarProgressoCurso.js';
import { supabase } from './supabaseClient.js';

export async function carregarDados(user_id, course_id) {
  const tituloCurso = document.getElementById("tituloCurso");
  const descricaoCurso = document.getElementById("descricaoCurso");

  if (!user_id || !course_id) {
    narrar("❌ Parâmetros ausentes na URL.", "error");
    return;
  }

  const { data: curso, error: erroCurso } = await supabase
    .from('courses')
    .select('*')
    .eq('id', course_id)
    .single();

  if (erroCurso || !curso) {
    narrar("❌ Erro ao carregar curso.", "error");
    tituloCurso.textContent = "Erro ao carregar curso";
    return;
  }

  tituloCurso.textContent = curso.title;
  descricaoCurso.textContent = curso.description;

  const { data: lista, error: erroAulas } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', course_id)
    .order('order');

  if (erroAulas || !lista || lista.length === 0) {
    narrar("⚠️ Nenhuma aula encontrada.", "warning");
    return;
  }

  const aulas = await Promise.all(
    lista.map(async (aula) => {
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

      aula.quizEnviado = !!quiz?.length;
      return aula;
    })
  );

  window.aulas = aulas;
  listarAulas(aulas);
  selecionarAulaInicial(aulas);
  carregarProgressoCurso(supabase, user_id, course_id); // ✅ AJUSTE AQUI
}
