const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bkueljjvhijojzcyodvk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...CHAVE_COMPLETA'
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método não permitido' };
  }

  const { user_id, course_id, lesson_id } = JSON.parse(event.body || '{}');

  if (!user_id || !course_id || !lesson_id) {
    return { statusCode: 400, body: 'Parâmetros obrigatórios ausentes' };
  }

  // 1. Buscar segmentos
  const { data: segmentos, error } = await supabase
    .from('progress_segments')
    .select('segment, duration')
    .eq('user_id', user_id)
    .eq('course_id', course_id)
    .eq('lesson_id', lesson_id);

  if (error) {
    return { statusCode: 500, body: 'Erro ao buscar segmentos' };
  }

  if (!segmentos || segmentos.length === 0) {
    return { statusCode: 200, body: 'Nenhum segmento encontrado' };
  }

  // 2. Unir segmentos sobrepostos
  const unificados = unirSegmentos(segmentos.map(s => s.segment));
  const tempoAssistido = unificados.reduce((soma, s) => soma + (s.end - s.start), 0);

  const duracaoReal = segmentos[0].duration; // Supomos que seja igual em todos
  const percentual = tempoAssistido / duracaoReal;

  const completed = percentual >= 0.99;

  // 3. Upsert na tabela progress
  await supabase
    .from('progress')
    .upsert({
      user_id,
      course_id,
      lesson_id,
      duration: duracaoReal,
      watched_seconds: tempoAssistido,
      completed
    }, { onConflict: 'user_id,course_id,lesson_id' });

  // 4. (Opcional) Deletar segmentos já processados
  await supabase
    .from('progress_segments')
    .delete()
    .eq('user_id', user_id)
    .eq('course_id', course_id)
    .eq('lesson_id', lesson_id);

  return {
    statusCode: 200,
    body: JSON.stringify({
      watched: tempoAssistido,
      duration: duracaoReal,
      percentual: Math.round(percentual * 100),
      completed
    })
  };
};

// Função auxiliar para unir segmentos sobrepostos
function unirSegmentos(segmentos) {
  if (!segmentos || segmentos.length === 0) return [];

  const ordenados = segmentos.sort((a, b) => a.start - b.start);
  const resultado = [ordenados[0]];

  for (let i = 1; i < ordenados.length; i++) {
    const anterior = resultado[resultado.length - 1];
    const atual = ordenados[i];

    if (atual.start <= anterior.end) {
      anterior.end = Math.max(anterior.end, atual.end); // Mescla
    } else {
      resultado.push(atual);
    }
  }

  return resultado;
}
