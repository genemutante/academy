// /js/verificarQuizRespondido.js
import { supabase } from './supabaseClient.js';

export async function verificarQuizRespondido(userId, lessonId) {
  const { data, error } = await supabase
    .from('user_quiz_results')
    .select('id')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .limit(1);

  return !!(data && data.length > 0);
}


// /js/narrativa.js
const narrativaGravada = [];
let modoNarrativoAtivo = true;

export function narrar(texto, tipo = "info") {
  if (!modoNarrativoAtivo) return;

  const ul = document.getElementById("narrativaLog");
  if (!ul) return;

  const cores = {
    info: "text-blue-300",
    success: "text-green-400",
    warning: "text-yellow-400",
    error: "text-red-400"
  };

  const agora = new Date();
  const timestamp = agora.toLocaleTimeString('pt-BR', { hour12: false });

  narrativaGravada.push({ texto, tipo, timestamp });

  const li = document.createElement("li");
  const cor = cores[tipo] || cores.info;
  li.className = `${cor} leading-snug whitespace-pre-wrap`;
  li.innerText = `[${timestamp}] ${texto}`;
  ul.appendChild(li);

  ul.parentElement.scrollTop = ul.parentElement.scrollHeight;
}

export function exibirMensagemAluno(mensagem, tipo = "info") {
  const msgEl = document.getElementById("mensagemAluno");
  if (!msgEl) return;

  const cores = {
    info: "text-blue-600",
    warning: "text-yellow-600",
    error: "text-red-600",
    success: "text-green-600"
  };

  msgEl.className = `text-sm animate-pulse font-medium ${cores[tipo] || cores.info}`;
  msgEl.textContent = mensagem;
}


// /js/supabaseClient.js
export const supabase = window.supabase.createClient(
  'https://bkueljjvhijojzcyodvk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdWVsamp2aGlqb2p6Y3lvZHZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzUwNTQ4OSwiZXhwIjoyMDU5MDgxNDg5fQ.o-G5KmxoyfQjeNM5e7rbgxpryOHYC9k1OIo9fYzyeYE'
);
