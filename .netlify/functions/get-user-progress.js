const { createClient } = require('@supabase/supabase-js')

const client = createClient(
  'https://bkueljjvhijojzcyodvk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdWVsamp2aGlqb2p6Y3lvZHZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzUwNTQ4OSwiZXhwIjoyMDU5MDgxNDg5fQ.o-G5KmxoyfQjeNM5e7rbgxpryOHYC9k1OIo9fYzyeYE'
)

exports.handler = async (event) => {
  const { user_id, course_id } = event.queryStringParameters

  if (!user_id || !course_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'user_id e course_id são obrigatórios' })
    }
  }

  const { data, error } = await client
    .from('user_progress')
    .select('lesson_id')
    .eq('user_id', user_id)
    .eq('course_id', course_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data || {})
  }
}
