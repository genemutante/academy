// auth.js

// Função para validar e obter dados do usuário logado
export async function verificarLoginObrigatorio() {
  const userId = localStorage.getItem('user_id');
  const userName = localStorage.getItem('user_name');

  if (!userId) {
    window.location.href = '/'; // Redireciona para login
    return null;
  }

  return { userId, userName };
}

// Função que armazena informações após login bem-sucedido
export function salvarSessao(user) {
  localStorage.setItem('user_id', user.id);
  localStorage.setItem('user_name', user.name || '');
}

// Função para encerrar a sessão completamente
export async function logout() {
  try {
    // Supabase signOut opcional (caso use autenticação completa)
    if (window.supabase) await supabase.auth.signOut();
  } catch (e) {
    console.warn('⚠️ Erro ao sair da Supabase:', e.message);
  }

  localStorage.clear();
  sessionStorage.clear();
  window.location.href = '/';
}
