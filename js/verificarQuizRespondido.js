import { supabase } from './supabaseClient.js';

/**
 * Verifica se o usuário já respondeu o quiz de uma aula específica.
 * @param {string} userId - ID do usuário.
 * @param {string} lessonId - ID da aula.
 * @returns {Promise<boolean>} Retorna true se já respondeu, false caso contrário.
 */
export async function verificarQuizRespondido(userId, lessonId) {
  const { data, error } = await supabase
    .from('user_quiz_results')
    .select('id')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .limit(1);

  if (error) {
    console.error('❌ Erro ao verificar quiz respondido:', error.message);
    return false;
  }

  return !!(data && data.length > 0);
}
