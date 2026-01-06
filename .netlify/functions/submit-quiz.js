const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://hiigckoowkrpewlybfef.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaWdja29vd2tycGV3bHliZmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTc3NzIsImV4cCI6MjA4MzI5Mzc3Mn0.b5Uf3GXkE_jOVE0J1h3ssWdldiFjm6qQ1yUZr_Mu3Oo'
  );
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  const body = JSON.parse(event.body);
  const { userId, quizId, answers } = body;

  if (!userId || !quizId || !Array.isArray(answers)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Parâmetros inválidos' }),
    };
  }

  // Obter gabarito
  const { data: correctOptions, error } = await supabase
    .from('options')
    .select('id, question_id, is_correct')
    .in('question_id', answers.map(a => a.question_id));

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }

  // Corrigir respostas
  let score = 0;

  for (const answer of answers) {
    const correct = correctOptions.find(
      (opt) =>
        opt.question_id === answer.question_id &&
        opt.id === answer.option_id &&
        opt.is_correct === true
    );
    if (correct) score++;
  }

  // Salvar resultado
  const { error: insertError } = await supabase
    .from('user_quiz_results')
    .insert({
      user_id: userId,
      quiz_id: quizId,
      score: score,
    });

  if (insertError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: insertError.message }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Resultado salvo com sucesso',
      score,
	  total: answers.length

    }),
  };
};

