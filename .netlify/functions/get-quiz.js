const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bkueljjvhijojzcyodvk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdWVsamp2aGlqb2p6Y3lvZHZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzUwNTQ4OSwiZXhwIjoyMDU5MDgxNDg5fQ.o-G5KmxoyfQjeNM5e7rbgxpryOHYC9k1OIo9fYzyeYE'
);

exports.handler = async (event) => {
  const quizId = event.queryStringParameters?.quizId;
  const includeAnswers = event.queryStringParameters?.withAnswers === 'true';

  if (!quizId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Parâmetro quizId obrigatório' }),
    };
  }

  // Buscar perguntas
  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('id, text, weight')
    .eq('quiz_id', quizId);

  if (qError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: qError.message }),
    };
  }

  // Buscar alternativas para todas as perguntas
  const questionIds = questions.map((q) => q.id);

  const { data: options, error: oError } = await supabase
    .from('options')
    .select('id, question_id, text, is_correct')
    .in('question_id', questionIds);

  if (oError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: oError.message }),
    };
  }

  // Agrupar opções por pergunta
  const grouped = questions.map((q) => ({
    ...q,
    options: options
      .filter((o) => o.question_id === q.id)
      .map((opt) => ({
        id: opt.id,
        text: opt.text,
        ...(includeAnswers ? { is_correct: opt.is_correct } : {}),
      })),
  }));

  return {
    statusCode: 200,
    body: JSON.stringify(grouped),
  };
};
