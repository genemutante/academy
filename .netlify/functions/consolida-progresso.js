const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://hiigckoowkrpewlybfef.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaWdja29vd2tycGV3bHliZmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTc3NzIsImV4cCI6MjA4MzI5Mzc3Mn0.b5Uf3GXkE_jOVE0J1h3ssWdldiFjm6qQ1yUZr_Mu3Oo'
  );

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  try {
    const { user_id, course_id, lesson_id } = JSON.parse(event.body);

    if (!user_id || !course_id || !lesson_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Parâmetros obrigatórios ausentes' })
      };
    }

    // Verifica se já existe
    const { data: existente } = await supabase
      .from('progress')
      .select('id')
      .eq('user_id', user_id)
      .eq('lesson_id', lesson_id)
      .single();

    if (existente) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Progresso já registrado' })
      };
    }

    // Insere novo progresso
    const { error } = await supabase
      .from('progress')
      .insert([{ user_id, course_id, lesson_id, completed: true }]);

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro ao salvar progresso', detalhes: error.message })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Progresso consolidado com sucesso' })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno', detalhes: err.message })
    };
  }
};
