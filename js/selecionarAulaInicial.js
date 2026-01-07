import { selecionarAula } from './selecionarAula.js';
import { narrar } from './narrativa.js';

/**
 * Seleciona a aula inicial baseada no progresso do aluno.
 * Garante que o ID correto da aula seja passado para evitar conflitos com IDs de cursos.
 */
export function selecionarAulaInicial(aulas, user_id) {

  console.log("🚨 Função selecionarAulaInicial foi chamada");
  console.groupCollapsed("🧭 [selecionarAulaInicial] Iniciando seleção da aula inicial");

  // 1. Validação de entrada
  if (!Array.isArray(aulas) || aulas.length === 0) {
    console.error("❌ Lista de aulas está vazia ou inválida:", aulas);
    console.groupEnd();
    return;
  }

  // 2. Mapeamento e Normalização (Ajuste Crítico para IDs)
  // Se 'a.id' estiver vindo como o ID do curso por erro na query, 
  // tentamos priorizar 'a.lesson_id' ou avisamos o log.
  const aulasNormalizadas = aulas.map(a => {
    const idCorreto = (a.id === a.course_id && a.lesson_id) ? a.lesson_id : a.id;
    return { ...a, id: idCorreto };
  });

  // Debug visual da tabela de aulas recebidas
  console.table(aulasNormalizadas.map((a, i) => ({
    Ordem: i + 1,
    ID: a.id,
    Título: a.title,
    Status: a.status,
    QuizEnviado: a.quizEnviado,
    ID_Curso: a.course_id
  })));

  // 3. Regra de Negócio 1: Retomar aula "Em andamento"
  const emAndamento = aulasNormalizadas.find(a => a.status === '🕒 Em andamento');
  if (emAndamento) {
    console.log("🔄 Aula em andamento detectada:", emAndamento.title);
    console.groupEnd();
    narrar(`📌 Retomando aula: "${emAndamento.title}".`, "info");
    return selecionarAula(emAndamento, user_id);
  }

  // 4. Regra de Negócio 2: Próxima aula não concluída (ou sem quiz enviado)
  const proxima = aulasNormalizadas.find(a => !(a.status === '✔ Concluída' && a.quizEnviado));
  if (proxima) {
    console.log("➡️ Próxima aula sugerida:", proxima.title);
    console.groupEnd();
    narrar(`🚀 Iniciando: "${proxima.title}"`, "info");
    return selecionarAula(proxima, user_id);
  }

  // 5. Regra de Negócio 3: Se tudo estiver concluído, abre a última aula
  const ultimaConcluida = [...aulasNormalizadas].reverse().find(a => a.status === '✔ Concluída');
  if (ultimaConcluida) {
    console.log("✅ Todas as aulas concluídas. Abrindo a última.");
    console.groupEnd();
    narrar(`✅ Curso finalizado. Revendo: "${ultimaConcluida.title}"`, "info");
    return selecionarAula(ultimaConcluida, user_id);
  }

  console.warn("⚠️ Nenhuma aula selecionada pelos critérios.");
  console.groupEnd();
}
