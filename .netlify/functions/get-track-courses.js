const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://bkueljjvhijojzcyodvk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdWVsamp2aGlqb2p6Y3lvZHZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzUwNTQ4OSwiZXhwIjoyMDU5MDgxNDg5fQ.o-G5KmxoyfQjeNM5e7rbgxpryOHYC9k1OIo9fYzyeYE'
)



exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' })
    }
  }

  const trackId = event.queryStringParameters?.track_id

  if (!trackId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Parâmetro track_id é obrigatório' })
    }
  }

  try {
    const { data, error } = await supabase
      .from('track_courses')
      .select('course_id, courses ( id, title, description )')
      .eq('track_id', trackId)

    if (error) {
      console.error('[get-track-courses] ERRO Supabase:', error.message)
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
    console.error('[get-track-courses] ERRO GERAL:', err.message)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno: ' + err.message })
    }
  }
}
