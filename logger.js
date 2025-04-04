// logger.js

export function log(mensagem, tipo = 'info') {
  const logArea = document.getElementById('log');

  // 🔒 Garante que o elemento exista para evitar erro
  if (!logArea) {
    console.warn('⚠️ Elemento de log (#log) não encontrado no DOM.');
    return;
  }

  const linha = document.createElement('div');

  switch (tipo) {
    case 'erro':
      linha.style.color = '#f87171'; // vermelho claro
      linha.textContent = `❌ ${mensagem}`;
      break;
    case 'aviso':
      linha.style.color = '#facc15'; // amarelo
      linha.textContent = `⚠️ ${mensagem}`;
      break;
    default:
      linha.style.color = '#10b981'; // verde claro
      linha.textContent = `📄 ${mensagem}`;
  }

  logArea.appendChild(linha);
  logArea.scrollTop = logArea.scrollHeight;
}

export function limparLog() {
  const logArea = document.getElementById('log');

  if (!logArea) {
    console.warn('⚠️ Elemento de log (#log) não encontrado ao tentar limpar.');
    return;
  }

  logArea.innerHTML = '';
}
