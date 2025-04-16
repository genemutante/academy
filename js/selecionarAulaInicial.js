export function selecionarAulaInicial(aulas, user_id) {
  console.groupCollapsed("🧭 [selecionarAulaInicial] Iniciando seleção da aula inicial");

  if (!Array.isArray(aulas) || aulas.length === 0) {
    console.error("❌ Lista de aulas está vazia ou inválida:", aulas);
    console.groupEnd();
    return;
  }

  console.table(aulas.map((a, i) => ({
    Ordem: i + 1,
    ID: a.id,
    Título: a.title,
    Status: a.status,
    QuizEnviado: a.quizEnviado
  })));

  const emAndamento = aulas.find(a => a.status === '🕒 Em andamento');
  if (emAndamento) {
    console.log("🔄 Aula em andamento:", emAndamento.title);
    selecionarAula(emAndamento, user_id);
    narrar(`📌 Aula em andamento detectada: "${emAndamento.title}". Reabrindo automaticamente.`, "info");
    console.groupEnd();
    return;
  }

  const proxima = aulas.find(a => !(a.status === '✔ Concluída' && a.quizEnviado));
  if (proxima) {
    console.log("➡️ Próxima aula desbloqueada:", proxima.title);
    selecionarAula(proxima, user_id);
    narrar(`🚀 Iniciando próxima aula desbloqueada: "${proxima.title}"`, "info");
    console.groupEnd();
    return;
  }

  const ultimaConcluida = [...aulas].reverse().find(a => a.status === '✔ Concluída');
  if (ultimaConcluida) {
    console.log("✅ Última aula concluída:", ultimaConcluida.title);
    selecionarAula(ultimaConcluida, user_id);
    narrar(`🎉 Todas as aulas e quizzes foram concluídos! Última aula foi: "${ultimaConcluida.title}"`, "success");
    console.groupEnd();
    return;
  }

  console.warn("⚠️ Nenhuma aula disponível para seleção.");
  narrar("⚠️ Nenhuma aula disponível para seleção.", "warning");
  console.groupEnd();
}
