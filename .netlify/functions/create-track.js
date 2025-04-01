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
