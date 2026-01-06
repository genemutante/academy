const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://hiigckoowkrpewlybfef.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaWdja29vd2tycGV3bHliZmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTc3NzIsImV4cCI6MjA4MzI5Mzc3Mn0.b5Uf3GXkE_jOVE0J1h3ssWdldiFjm6qQ1yUZr_Mu3Oo'
  );

exports.handler = async (event) => {
  try {
    const { email } = JSON.parse(event.body || '{}');

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Parâmetro "email" é obrigatório.' })
      };
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', email)
      .single();

    if (error || !data) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Usuário não encontrado.' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno no servidor.' })
    };
  }
};
