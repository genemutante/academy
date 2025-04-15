export async function carregarProgressoCurso(supabase, user_id, course_id) {
  const { data } = await supabase.rpc('fn_progresso_curso_por_usuario', {
    p_user_id: user_id,
    p_course_id: course_id
  });

  if (data?.length > 0) {
    const pct = data[0].percentual_conclusao || 0;
    const barraProgresso = document.getElementById('barraProgresso');
    const textoProgresso = document.getElementById('textoProgresso');
    if (barraProgresso) barraProgresso.style.width = pct + '%';
    if (textoProgresso) textoProgresso.textContent = pct + '%';
  }
}
