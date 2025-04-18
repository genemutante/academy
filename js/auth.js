// js/auth.js

/**
 * Salva os dados da sessão do usuário no localStorage.
 * @param {{ id: string, name: string }} param0
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
 * Limpa localStorage, sessionStorage e redireciona para a tela inicial.
 */
export function logout() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = 'index.html';
}

/**
 * Verifica se a sessão do usuário é válida.
 * Se inválida, exibe mensagem amigável e redireciona.
 * 
 * IMPORTANTE:
 * Caso deseje controlar manualmente o redirecionamento, comente a linha `forcarRedirecionamento()`.
 */
export async function verificarLoginObrigatorio() {
  const sessao = JSON.parse(localStorage.getItem('sessaoUsuario'));

  if (!sessao || !sessao.userId || !sessao.userName) {
    forcarRedirecionamento();
    return null;
  }

  return sessao;
}

/**
 * Exibe mensagem de sessão inválida e redireciona após 5 segundos.
 */
function forcarRedirecionamento() {
  document.body.innerHTML = `
    <div style="text-align: center; margin-top: 20vh; font-family: sans-serif;">
      <h1 style="font-size: 2rem; color: #1E3A8A;">🔒 Sessão inválida ou expirada</h1>
      <p style="margin-top: 1rem; color: #555;">Você será redirecionado para a tela de login em 5 segundos.</p>
    </div>
  `;

  setTimeout(() => {
    window.location.href = 'index.html';
  }, 5000);
}
