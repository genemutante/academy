// js/verificarConclusaoAula.js

export async function verificarConclusaoAula({
  duration,
  maiorTempoVisualizado,
  user_id,
  aulaAtual,
  habilitarQuiz,
  listarAulas,
  carregarProgressoCurso,
  exibirMensagemAluno,
  mostrarTransicaoParaProximaAula,
  verificarQuizRespondido
}) {
  const progressoEl = document.getElementById("progressoTexto");
  const sugestaoEl = document.getElementById("recomecarSugestao");

  const percentual = ((maiorTempoVisualizado / duration) * 100).toFixed(1);

  if (percentual >= 97) {
    const quizRespondido = await verificarQuizRespondido(user_id, aulaAtual.id);
    aulaAtual.quizEnviado = quizRespondido;

    if (quizRespondido) {
      if (progressoEl) progressoEl.textContent = "✅ Aula concluída";
      if (sugestaoEl) sugestaoEl.innerHTML = "";

      exibirMensagemAluno("✅ Aula concluída! A próxima começará em 5 segundos...", "success");

      await habilitarQuiz(aulaAtual.id);
      listarAulas();
      carregarProgressoCurso();

      const atualIndex = window.aulas.findIndex(a => a.id === aulaAtual.id);
      const proxima = window.aulas[atualIndex + 1];

      if (proxima) {
        mostrarTransicaoParaProximaAula(proxima, window.selecionarAula);
      } else {
        exibirMensagemAluno("🏁 Fim do curso. Parabéns!", "success");
      }

    } else {
      if (progressoEl) progressoEl.textContent = "🕒 Aula assistida, avaliação pendente";
      exibirMensagemAluno("📋 Você precisa responder a avaliação para concluir esta aula.", "warning");

      const alerta = document.createElement("div");
      alerta.className = "text-sm text-red-500 mt-2 font-medium animate-pulse";
      alerta.textContent = "🚫 A avaliação ainda não foi enviada. Aula não será marcada como concluída.";

      if (progressoEl) progressoEl.appendChild(alerta);
    }
  }
}
