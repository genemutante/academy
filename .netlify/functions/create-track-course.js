const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://bkueljjvhijojzcyodvk.supabase.co',
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdWVsamp2aGlqb2p6Y3lvZHZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzUwNTQ4OSwiZXhwIjoyMDU5MDgxNDg5fQ.o-G5KmxoyfQjeNM5e7rbgxpryOHYC9k1OIo9fYzyeYE'
)
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' })
    }
  }

  try {
    const body = JSON.parse(event.body)
    const { track_id, course_id } = body

    if (!track_id || !course_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'track_id e course_id são obrigatórios' })
      }
    }

    const { data, error } = await supabase
      .from('track_courses')
      .insert([{ track_id, course_id }])
      .select(`
        id,
        course:course_id (
          id,
          title
        )
      `)
      .single()

    if (error) {
      console.error('[create-track-course] ERRO Supabase:', error.message)
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data.course)
    }
  } catch (err) {
    console.error('[create-track-course] ERRO GERAL:', err.message)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno: ' + err.message })
    }
  }
}
