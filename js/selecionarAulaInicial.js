import { selecionarAula } from './selecionarAula.js';
import { narrar } from './narrativa.js';

export function selecionarAulaInicial(aulas, user_id) {
  const emAndamento = aulas.find(a => a.status === '🕒 Em andamento');
  const ultimaConcluida = [...aulas].reverse().find(a => a.status === '✔ Concluída');
  const proxima = aulas.find(a => !(a.status === '✔ Concluída' && a.quizEnviado));

  if (emAndamento) {
    selecionarAula(emAndamento, user_id);
    narrar(`📌 Aula em andamento detectada: "${emAndamento.title}". Reabrindo automaticamente.`, "info");
  } else if (proxima) {
    selecionarAula(proxima, user_id);
    narrar(`🚀 Iniciando próxima aula desbloqueada: "${proxima.title}"`, "info");
  } else if (ultimaConcluida) {
    selecionarAula(ultimaConcluida, user_id);
    narrar(`🎉 Todas as aulas e quizzes foram concluídos! Última aula foi: "${ultimaConcluida.title}"`, "success");
  } else {
    narrar("⚠️ Nenhuma aula disponível para seleção.", "warning");
  }
}
