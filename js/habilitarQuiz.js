import { supabase } from './supabaseClient.js';
import { listarAulas } from './listarAulas.js';
import { carregarProgressoCurso } from './carregarProgressoCurso.js';
import { mostrarTransicaoParaProximaAula } from './mostrarTransicaoParaProximaAula.js';
import { narrar, exibirMensagemAluno } from './narrativa.js';
import { verificarQuizRespondido } from './verificarQuizRespondido.js';

export async function habilitarQuiz(aulaId) {
  const btnQuiz = document.getElementById("btnQuiz");
  const jaFez = await verificarQuizRespondido(window.user_id, aulaId);

  if (window.aulaAtual?.status === '✔ Concluída' && jaFez) {
    narrar("✅ Quiz já enviado e aula concluída. Botão será mantido bloqueado.", "info");
  }

  if (jaFez) {
    btnQuiz.disabled = true;
    btnQuiz.textContent = "✅ Avaliação enviada";
    btnQuiz.className = "bg-gray-200 text-gray-600 px-4 py-2 rounded text-sm cursor-not-allowed";
    btnQuiz.title = "Você já respondeu esta avaliação";
    btnQuiz.onclick = null;
    return;
  }

  btnQuiz.disabled = false;
  btnQuiz.textContent = "📝 Fazer Avaliação da Aula";
  btnQuiz.className = "bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded text-sm transition";
  btnQuiz.title = "Abrir avaliação desta aula";

  btnQuiz.addEventListener("click", () => {
    const quizContainer = document.createElement('div');
    quizContainer.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50";

    const modalHTML = `
      <div class="bg-white w-full max-w-2xl h-[90vh] p-4 rounded-xl shadow-xl relative border border-slate-200 overflow-hidden">
        <button onclick="this.closest('div').parentElement.remove()" class="absolute top-3 right-4 text-gray-500 hover:text-red-600 text-xl">&times;</button>
        <iframe
          src="quiz.html?user_id=${window.user_id}&lesson_id=${aulaId}"
          class="w-full h-full rounded-lg border border-slate-200"
          frameborder="0"
        ></iframe>
      </div>
    `;

    quizContainer.innerHTML = modalHTML;
    document.body.appendChild(quizContainer);

    const observer = new MutationObserver(async () => {
      if (!document.body.contains(quizContainer)) {
        console.log("📤 Quiz fechado, revalidando progresso...");

        const { data: quiz } = await supabase
          .from('user_quiz_results')
          .select('id')
          .eq('user_id', window.user_id)
          .eq('lesson_id', aulaId)
          .limit(1);

        window.aulaAtual.quizEnviado = !!(quiz && quiz.length > 0);

        if (window.aulaAtual.quizEnviado) {
          await habilitarQuiz(aulaId);
          listarAulas(window.aulas, window.user_id);

          carregarProgressoCurso();

          const atualIndex = window.aulas.findIndex(a => a.id === aulaId);
          const proxima = window.aulas[atualIndex + 1];

          if (proxima) {
            mostrarTransicaoParaProximaAula(proxima);
          }
        }

        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });

  if (window.aulaAtual.status === '✔ Concluída' && window.aulaAtual.quizEnviado) {
    btnQuiz.disabled = true;
    btnQuiz.textContent = "✅ Avaliação enviada";
    btnQuiz.className = "bg-gray-200 text-gray-600 px-4 py-2 rounded text-sm cursor-not-allowed";
    btnQuiz.onclick = null;
  }
}
