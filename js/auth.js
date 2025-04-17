// js/auth.js

import { supabase } from './supabaseClient.js';

export async function verificarLoginObrigatorio() {
  const session = await supabase.auth.getSession();
  const sessao = session?.data?.session;

  if (!sessao) {
    // Redireciona se não estiver logado
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/'; // ou '/index.html'
    return null;
  }

  const { user } = sessao;
  const { data } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', user.id)
    .single();

  if (!data) {
    window.location.href = '/';
    return null;
  }

  return {
    userId: data.id,
    userName: data.name,
  };
}

export async function logout() {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn("Erro no logout:", e);
  }

  localStorage.clear();
  sessionStorage.clear();
  window.location.href = '/';
}
