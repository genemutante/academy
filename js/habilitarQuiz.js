import { supabase } from './supabaseClient.js';
import { listarAulas } from './listarAulas.js';
import { carregarProgressoCurso } from './carregarProgressoCurso.js';
import { mostrarTransicaoParaProximaAula } from './mostrarTransicaoParaProximaAula.js';
import { narrar } from './narrativa.js';
import { verificarQuizRespondido } from './verificarQuizRespondido.js';

export async function habilitarQuiz(aulaId) {
  const btnQuiz = document.getElementById("btnQuiz");
  if (!btnQuiz) return;

  const userId = window.user_id;
  const quizRespondido = await verificarQuizRespondido(userId, aulaId);

  window.aulaAtual.quizEnviado = quizRespondido;

  const aulaConcluida = window.aulaAtual?.status === '✔ Concluída';

  if (quizRespondido && aulaConcluida) {
    btnQuiz.disabled = true;
    btnQuiz.textContent = "✅ Avaliação enviada";
    btnQuiz.className = "bg-gray-200 text-gray-600 px-4 py-2 rounded text-sm cursor-not-allowed";
    btnQuiz.title = "Você já respondeu esta avaliação";
    btnQuiz.onclick = null;
    narrar("✅ Quiz já enviado e aula concluída. Botão bloqueado.", "success");
    return;
  }

  // Quiz ainda não feito – botão ativo
  btnQuiz.disabled = false;
  btnQuiz.textContent = "📝 Fazer Avaliação da Aula";
  btnQuiz.className = "bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded text-sm transition";
  btnQuiz.title = "Clique para fazer a avaliação desta aula";
  btnQuiz.onclick = () => abrirModalQuiz(userId, aulaId);
}

function abrirModalQuiz(userId, aulaId) {
  const quizContainer = document.createElement('div');
  quizContainer.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50";

  quizContainer.innerHTML = `
    <div class="bg-white w-full max-w-2xl h-[90vh] p-4 rounded-xl shadow-xl relative border border-slate-200 overflow-hidden">
      <button onclick="this.closest('div').parentElement.remove()" class="absolute top-3 right-4 text-gray-500 hover:text-red-600 text-xl">&times;</button>
      <iframe
        src="quiz.html?user_id=${userId}&lesson_id=${aulaId}"
        class="w-full h-full rounded-lg border border-slate-200"
        frameborder="0"
      ></iframe>
    </div>
  `;

  document.body.appendChild(quizContainer);

  const observer = new MutationObserver(async () => {
    if (!document.body.contains(quizContainer)) {
      console.log("📤 Quiz fechado. Verificando status atualizado...");

      const { data: quiz } = await supabase
        .from('user_quiz_results')
        .select('id')
        .eq('user_id', userId)
        .eq('lesson_id', aulaId)
        .limit(1);

      const quizEnviado = !!(quiz && quiz.length > 0);
      window.aulaAtual.quizEnviado = quizEnviado;

      if (quizEnviado) {
        await habilitarQuiz(aulaId); // Atualiza botão
        listarAulas(window.aulas, userId); // Atualiza lista lateral
        carregarProgressoCurso(); // Atualiza barra de progresso do topo

        const atualIndex = window.aulas.findIndex(a => a.id === aulaId);
        const proxima = window.aulas[atualIndex + 1];
        if (proxima) mostrarTransicaoParaProximaAula(proxima);
      }

      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
