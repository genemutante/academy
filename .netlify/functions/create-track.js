const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    'https://hiigckoowkrpewlybfef.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaWdja29vd2tycGV3bHliZmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTc3NzIsImV4cCI6MjA4MzI5Mzc3Mn0.b5Uf3GXkE_jOVE0J1h3ssWdldiFjm6qQ1yUZr_Mu3Oo'
  );

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' })
    }
  }

  try {
    const body = JSON.parse(event.body)
    console.log('[create-track] Dados recebidos:', body)

    const { title, description, created_by } = body

    if (!title || !created_by) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Título e created_by são obrigatórios' })
      }
    }

    const { data, error } = await supabase
      .from('tracks')
      .insert([{ title, description, created_by }])
      .select()
      .single()

    if (error) {
      console.error('[create-track] ERRO Supabase:', error.message)
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    }

  } catch (err) {
    console.error('[create-track] ERRO GERAL:', err.message)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno: ' + err.message })
    }
  }
}

