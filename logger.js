// logger.js

const logArea = document.getElementById('log');

export function log(mensagem, tipo = 'info') {
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
  logArea.innerHTML = '';
}
