const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    'https://hiigckoowkrpewlybfef.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaWdja29vd2tycGV3bHliZmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTc3NzIsImV4cCI6MjA4MzI5Mzc3Mn0.b5Uf3GXkE_jOVE0J1h3ssWdldiFjm6qQ1yUZr_Mu3Oo'
  );

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

