// js/auth.js
const supabase = window.supabase.createClient(
  'https://bkueljjvhijojzcyodvk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdWVsamp2aGlqb2p6Y3lvZHZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzUwNTQ4OSwiZXhwIjoyMDU5MDgxNDg5fQ.o-G5KmxoyfQjeNM5e7rbgxpryOHYC9k1OIo9fYzyeYE'
);

/**
 * Verifica se há login válido baseado na URL e armazena os dados localmente.
 */
export async function verificarLoginObrigatorio() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('user_id');

  if (!userId) {
    alert('⚠️ Acesso negado. Faça login primeiro.');
    window.location.href = '/';
    return null;
  }

  // Já está salvo localmente?
  const cached = JSON.parse(localStorage.getItem('sessao'));
  if (cached && cached.userId === userId) return cached;

  // Consulta nome do usuário
  const { data, error } = await supabase
    .from('users')
    .select('name')
    .eq('id', userId)
    .single();

  if (error || !data?.name) {
    alert('⚠️ Usuário inválido ou não encontrado.');
    window.location.href = '/';
    return null;
  }

  const sessao = { userId, userName: data.name };
  localStorage.setItem('sessao', JSON.stringify(sessao));
  return sessao;
}

/**
 * Faz logout forçado limpando cache e redirecionando.
 */
export async function logout() {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn("⚠️ Erro ao deslogar ou não logado no Supabase.");
  }

  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "/";
}
