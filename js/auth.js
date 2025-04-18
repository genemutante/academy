// js/auth.js

/**
 * Salva os dados da sessão localmente
 */
export function salvarSessao({ id, name }) {
  const sessao = {
    userId: id,
    userName: name,
    timestamp: Date.now()
  };
  localStorage.setItem('sessaoUsuario', JSON.stringify(sessao));
}

/**
 * Realiza logout, limpa dados e redireciona se necessário
 */
export function logout() {
  localStorage.clear();
  sessionStorage.clear();

  const estaNaRaiz = window.location.pathname === '/' || window.location.pathname === '/index.html';

  // Evita redirecionar para a mesma página (evita loop)
  if (!estaNaRaiz) {
    console.log('🔒 Logout detectado. Redirecionando para a raiz...');
    window.location.href = '/';
  } else {
    console.log('ℹ️ Logout na raiz. Nenhum redirecionamento necessário.');
  }
}

/**
 * Verifica se o usuário está logado.
 * Retorna os dados da sessão se válidos, senão exibe mensagem e redireciona.
 */
export async function verificarLoginObrigatorio() {
  const sessao = JSON.parse(localStorage.getItem('sessaoUsuario'));

  if (!sessao || !sessao.userId || !sessao.userName) {
    const estaNaRaiz = window.location.pathname === '/' || window.location.pathname === '/index.html';

    if (!estaNaRaiz) {
      mostrarMensagemSessaoInvalida(); // Mostra mensagem e redireciona após 5s
    }

    return null;
  }

  return sessao;
}

/**
 * Exibe uma mensagem elegante e redireciona para a raiz após 5 segundos
 */
function mostrarMensagemSessaoInvalida() {
  console.warn('⚠️ Sessão inválida. Redirecionando...');
  document.body.innerHTML = `
    <div style="text-align: center; margin-top: 20vh; font-family: sans-serif;">
      <h1 style="font-size: 2rem; color: #1E3A8A;">🔒 Sessão inválida ou expirada</h1>
      <p style="margin-top: 1rem; color: #555;">Você será redirecionado para a tela de login em 5 segundos.</p>
    </div>
  `;

  setTimeout(() => {
    window.location.href = '/'; // redireciona para a raiz que carrega index.html no iframe
  }, 5000);
}

/**
 * Caso você queira controle manual, comente a linha `mostrarMensagemSessaoInvalida()` acima
 * e trate você mesmo o comportamento dentro da página protegida.
 */
