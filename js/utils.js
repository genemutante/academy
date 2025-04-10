// utils.js

export function atualizarIndicadorLocal(segundos, duracao) {
  const el = document.getElementById("progressoTexto");
  if (!el) return;

  const pct = Math.min(100, Math.round((segundos / duracao) * 100));
  el.innerHTML = `<span class="animate-pulse">⏱️</span> ${segundos}s / ${duracao}s 📊 ${pct}%`;
}

export function mostrarNotificacao(texto) {
  const aviso = document.createElement('div');
  aviso.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50 text-sm font-medium transition-opacity';
  aviso.textContent = texto;

  document.body.appendChild(aviso);

  setTimeout(() => {
    aviso.classList.add('opacity-0');
    setTimeout(() => aviso.remove(), 500);
  }, 2500);
}
