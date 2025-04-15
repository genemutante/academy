export const narrativaGravada = [];
export let modoNarrativoAtivo = true;

/**
 * Registra uma mensagem na narrativa e exibe no painel.
 */
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
  li.className = `${cores[tipo] || cores.info} leading-snug whitespace-pre-wrap`;
  li.innerText = `[${timestamp}] ${texto}`;
  ul.appendChild(li);
  ul.parentElement.scrollTop = ul.parentElement.scrollHeight;
}

/**
 * Exporta os logs da narrativa para um arquivo .txt
 */
export function exportarNarrativa() {
  if (!narrativaGravada.length) {
    alert("Nenhuma narrativa registrada ainda.");
    return;
  }

  let conteudo = `📜 LOG DE EXECUÇÃO NARRADA - ${new Date().toLocaleString()}\n\n`;
  narrativaGravada.forEach(({ timestamp, texto, tipo }) => {
    conteudo += `[${timestamp}] (${tipo.toUpperCase()}) ${texto}\n`;
  });

  const blob = new Blob([conteudo], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `narrativa_execucao_${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Limpa narrativa e reinicia logs
 */
export function novaAnaliseNarrativa() {
  narrativaGravada.length = 0;
  const ul = document.getElementById("narrativaLog");
  if (ul) ul.innerHTML = '';
  narrar("🧹 Iniciei uma nova análise. A narrativa anterior foi limpa.", "info");
}

export function ativarNarracao() {
  modoNarrativoAtivo = true;
  document.getElementById("btnAtivarNarra")?.classList.add("hidden");
  document.getElementById("btnPausarNarra")?.classList.remove("hidden");
  narrar("🔔 Narração reativada manualmente a partir deste ponto.", "info");
}

export function pausarNarracao() {
  modoNarrativoAtivo = false;
  document.getElementById("btnPausarNarra")?.classList.add("hidden");
  document.getElementById("btnAtivarNarra")?.classList.remove("hidden");
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

