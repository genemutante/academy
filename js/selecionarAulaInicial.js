// selecionarAulaInicial.js
import { selecionarAula } from './selecionarAula.js';
import { narrar } from './narrativa.js';

export function selecionarAulaInicial(aulas, user_id) {
  console.groupCollapsed("🧭 [selecionarAulaInicial] Iniciando seleção da aula inicial");

  console.log("🧾 Total de aulas carregadas:", aulas.length);
  console.table(aulas.map(a => ({
    ID: a.id,
    Título: a.title,
    Status: a.status,
    QuizEnviado: a.quizEnviado
  })));

  const emAndamento = aulas.find(a => a.status === '🕒 Em andamento');
  if (emAndamento) {
    console.log("🔄 Aula em andamento encontrada:", emAndamento.title, `(ID: ${emAndamento.id})`);
    selecionarAula(emAndamento, user_id);
    narrar(`📌 Aula em andamento detectada: "${emAndamento.title}". Reabrindo automaticamente.`, "info");
    console.groupEnd();
    return;
  }

  const proxima = aulas.find(a => !(a.status === '✔ Concluída' && a.quizEnviado));
  if (proxima) {
    console.log("➡️ Próxima aula desbloqueada identificada:", proxima.title, `(ID: ${proxima.id})`);
    selecionarAula(proxima, user_id);
    narrar(`🚀 Iniciando próxima aula desbloqueada: "${proxima.title}"`, "info");
    console.groupEnd();
    return;
  }

  const ultimaConcluida = [...aulas].reverse().find(a => a.status === '✔ Concluída');
  if (ultimaConcluida) {
    console.log("✅ Todas concluídas. Última aula será reexibida:", ultimaConcluida.title, `(ID: ${ultimaConcluida.id})`);
    selecionarAula(ultimaConcluida, user_id);
    narrar(`🎉 Todas as aulas e quizzes foram concluídos! Última aula foi: "${ultimaConcluida.title}"`, "success");
    console.groupEnd();
    return;
  }

  console.warn("⚠️ Nenhuma aula disponível para seleção.");
  narrar("⚠️ Nenhuma aula disponível para seleção.", "warning");
  console.groupEnd();
}
