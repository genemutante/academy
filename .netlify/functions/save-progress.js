// ==========================
// 📁 .netlify/functions/save-progress.js
// ==========================

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
    const { user_id, track_id, course_id, lesson_id, duration, segment } = JSON.parse(event.body)

    if (!user_id || !course_id || !lesson_id || !segment) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Parâmetros obrigatórios ausentes' })
      }
    }

    // ✅ Verifica se já existe entrada
    const { data: existente, error: erroBusca } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user_id)
      .eq('course_id', course_id)
      .eq('lesson_id', lesson_id)
      .maybeSingle()

    if (erroBusca) {
      console.error('[save-progress] Erro ao buscar:', erroBusca)
    }

    if (existente) {
      // Atualiza segmento
      const { error: erroUpdate } = await supabase
        .from('user_progress')
        .update({
          duration,
          segment,
          updated_at: new Date().toISOString()
        })
        .eq('id', existente.id)

      if (erroUpdate) throw erroUpdate
    } else {
      // Cria novo
      const { error: erroInsert } = await supabase
        .from('user_progress')
        .insert([
          {
            user_id,
            track_id,
            course_id,
            lesson_id,
            duration,
            segment,
            completed: false,
            created_at: new Date().toISOString()
          }
        ])

      if (erroInsert) throw erroInsert
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    }
  } catch (err) {
    console.error('[save-progress] Erro fatal:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    }
  }
}
