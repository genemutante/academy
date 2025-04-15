    async function verificarQuizRespondido(userId, lessonId) {
      const { data, error } = await supabase
        .from('user_quiz_results')
        .select('id')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .limit(1);

      return !!(data && data.length > 0);
    }
