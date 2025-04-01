const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('https://bkueljjvhijojzcyodvk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdWVsamp2aGlqb2p6Y3lvZHZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzUwNTQ4OSwiZXhwIjoyMDU5MDgxNDg5fQ.o-G5KmxoyfQjeNM5e7rbgxpryOHYC9k1OIo9fYzyeYE')

exports.handler = async () => {
  const { data, error } = await supabase.from('tracks').select('*').order('created_at', { ascending: false })
  return error
    ? { statusCode: 500, body: JSON.stringify({ error: error.message }) }
    : { statusCode: 200, body: JSON.stringify(data) }
}
