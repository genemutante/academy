import { narrar } from './narrativa.js';
import { listarAulas } from './listarAulas.js';
import { selecionarAulaInicial } from './selecionarAulaInicial.js';
import { carregarProgressoCurso } from './carregarProgressoCurso.js';

export async function carregarDados(supabase, course_id, user_id, tituloCursoEl, descricaoCursoEl, listaAulasEl, aulasRef) {
  const { data: curso } = await supabase
    .from('courses')
    .select('*')
    .eq('id', course_id)
    .single();

  if (!curso) {
    narrar("❌ Falha ao carregar dados do curso no Supabase. Verifique o course_id ou a conexão.", "error");
    tituloCursoEl.textContent = "❌ Erro ao carregar curso";
    return;
  }

  tituloCursoEl.textContent = curso.title;
  descricaoCursoEl.textContent = curso.description;

  const { data: lista } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', course_id)
    .order('order');

  if (!lista || lista.length === 0) {
    narrar("⚠️ Nenhuma aula encontrada para este curso.", "warning");
    tituloCursoEl.textContent += " (sem aulas)";
    return;
  }

  const aulas = lista;

  const promises = aulas.map(async (aula) => {
    const { data: progresso, error } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
      p_user_id: user_id,
      p_lesson_id: aula.id
    });

    if (error) {
      narrar(`❌ Erro ao consultar progresso da aula "${aula.title}": ${error.message}`, "error");
    } else if (progresso?.length > 0) {
      const item = progresso[0];
      narrar(`📬 Supabase retornou progresso para aula "${aula.title}": ${item.segundos_assistidos}s assistidos. Status: ${item.status}.`, "info");
    } else {
      narrar(`📭 Nenhum progresso registrado para aula "${aula.title}".`, "warning");
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

  aulasRef.splice(0, aulasRef.length, ...(await Promise.all(promises)));
  listarAulas(aulasRef, listaAulasEl, user_id);

  requestAnimationFrame(() => {
    narrar("🚀 DOM estável e dados carregados. Selecionando aula apropriada...", "info");
    selecionarAulaInicial(aulasRef);
  });

  carregarProgressoCurso(supabase, user_id, course_id);
}
