// quiz.js
import { supabase } from './supabaseClient.js';
import { mostrarNotificacao } from './utils.js';

const btnQuiz = document.getElementById('btnQuiz');

export function configurarQuiz() {
  // placeholder para ações globais se necessário futuramente
}

export async function habilitarQuiz(aulaId) {
  const url = new URL(location.href);
  const user_id = url.searchParams.get('user_id');

  const { data: quiz } = await supabase
    .from('user_quiz_results')
    .select('id')
    .eq('user_id', user_id)
    .eq('lesson_id', aulaId)
    .limit(1);

  const jaFez = !!(quiz && quiz.length > 0);

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

  btnQuiz.onclick = () => abrirQuiz(aulaId, user_id);
}

function abrirQuiz(aulaId, user_id) {
  const quizContainer = document.createElement('div');
  quizContainer.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50";

  quizContainer.innerHTML = `
    <div class="bg-white w-full max-w-2xl h-[90vh] p-4 rounded-xl shadow-xl relative border border-slate-200 overflow-hidden">
      <button onclick="this.parentElement.parentElement.remove()" class="absolute top-3 right-4 text-gray-500 hover:text-red-600 text-xl">&times;</button>
      <iframe src="quiz.html?user_id=${user_id}&lesson_id=${aulaId}" class="w-full h-full rounded-lg border border-slate-200" frameborder="0"></iframe>
    </div>
  `;

  document.body.appendChild(quizContainer);
  mostrarNotificacao("🔔 Avaliação iniciada! Boa sorte!");
}
