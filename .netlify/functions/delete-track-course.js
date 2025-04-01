const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://bkueljjvhijojzcyodvk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdWVsamp2aGlqb2p6Y3lvZHZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzUwNTQ4OSwiZXhwIjoyMDU5MDgxNDg5fQ.o-G5KmxoyfQjeNM5e7rbgxpryOHYC9k1OIo9fYzyeYE'
)

exports.handler = async (event) => {
  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' })
    }
  }

  const id = event.queryStringParameters?.id

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'ID do relacionamento é obrigatório' })
    }
  }

  try {
    const { error } = await supabase
      .from('track_courses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[delete-track-course] ERRO Supabase:', error.message)
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    }
  } catch (err) {
    console.error('[delete-track-course] ERRO GERAL:', err.message)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno: ' + err.message })
    }
  }
}
