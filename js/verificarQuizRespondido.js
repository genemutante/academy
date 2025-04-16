import { supabase } from './supabaseClient.js';

/**
 * 🔍 Verifica se o usuário já respondeu o quiz da aula.
 * @param {string} userId - ID do usuário.
 * @param {string} lessonId - ID da aula.
 * @returns {Promise<boolean>} true se respondeu, false caso contrário.
 */
export async function verificarQuizRespondido(userId, lessonId) {
  const { data, error } = await supabase
    .from('user_quiz_results')
    .select('id')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .limit(1);

  if (error) {
    console.error(`❌ Erro ao verificar avaliação da aula ${lessonId}:`, error.message);
    return false;
  }

  return !!(data?.length);
}
