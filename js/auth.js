// js/auth.js

export function salvarSessao({ id, name }) {
  const sessao = {
    userId: id,
    userName: name,
    timestamp: Date.now()
  };
  localStorage.setItem('sessaoUsuario', JSON.stringify(sessao));
}

export function logout() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = '/';
}

export async function verificarLoginObrigatorio() {
  const sessao = JSON.parse(localStorage.getItem('sessaoUsuario'));

  if (!sessao || !sessao.userId || !sessao.userName) {
   // logout(); // força redirecionamento
    return null;
  }

  return sessao;
}
