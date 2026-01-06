const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    'https://hiigckoowkrpewlybfef.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaWdja29vd2tycGV3bHliZmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTc3NzIsImV4cCI6MjA4MzI5Mzc3Mn0.b5Uf3GXkE_jOVE0J1h3ssWdldiFjm6qQ1yUZr_Mu3Oo'
  );

exports.handler = async (event) => {
  const body = JSON.parse(event.body)
  const { data, error } = await supabase.from('options').insert([body]).select().single()
  return error
    ? { statusCode: 500, body: JSON.stringify({ error: error.message }) }
    : { statusCode: 200, body: JSON.stringify(data) }
}

