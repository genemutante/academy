const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bkueljjvhijojzcyodvk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdWVsamp2aGlqb2p6Y3lvZHZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzUwNTQ4OSwiZXhwIjoyMDU5MDgxNDg5fQ.o-G5KmxoyfQjeNM5e7rbgxpryOHYC9k1OIo9fYzyeYE'
);

exports.handler = async (event) => {
  const courseId = event.queryStringParameters?.courseId;

  if (!courseId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Parâmetro courseId obrigatório' }),
    };
  }

  const { data, error } = await supabase
    .from('lessons')
    .select('id, title, youtube_url, "order"')
    .eq('course_id', courseId)
    .order('order', { ascending: true });

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
