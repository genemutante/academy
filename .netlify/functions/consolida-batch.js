const { createClient } = require('@supabase/supabase-js');

// Mesma instância do Supabase
const supabase = createClient(
  'https://bkueljjvhijojzcyodvk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...CHAVE_COMPLETA'
);

// Reaproveita lógica de união de segmentos
function unirSegmentos(segmentos) {
  if (!segmentos || segmentos.length === 0) return [];
  const ordenados = segmentos.sort((a, b) => a.start - b.start);
  const resultado = [ordenados[0]];
  for (let i = 1; i < ordenados.length; i++) {
    const anterior = resultado[resultado.length - 1];
    const atual = ordenados[i];
    if (atual.start <= anterior.end) {
      anterior.end = Math.max(anterior.end, atual.end);
    } else {
      resultado.push(atual);
    }
  }
  return resultado;
}

exports.handler = async () => {
  try {
    // 1. Buscar combinações únicas
    const { data: segmentos } = await supabase
      .from('progress_segments')
      .select('user_id, course_id, lesson_id, duration, segment');

    if (!segmentos || segmentos.length === 0) {
      return {
        statusCode: 200,
        body: 'Nenhum progresso pendente encontrado.'
      };
    }

    // Agrupar por combinação única
    const mapa = new Map();

    for (const item of segmentos) {
      const chave = `${item.user_id}|${item.course_id}|${item.lesson_id}`;
      if (!mapa.has(chave)) {
        mapa.set(chave, { user_id: item.user_id, course_id: item.course_id, lesson_id: item.lesson_id, duration: item.duration, segmentos: [] });
      }
      mapa.get(chave).segmentos.push(item.segment);
    }

    // 2. Processar cada agrupamento
    for (const [, grupo] of mapa) {
      const unificados = unirSegmentos(grupo.segmentos);
      const tempoAssistido = unificados.reduce((soma, s) => soma + (s.end - s.start), 0);
      const percentual = tempoAssistido / grupo.duration;
      const completed = percentual >= 0.99;

      await supabase
        .from('progress')
        .upsert({
          user_id: grupo.user_id,
          course_id: grupo.course_id,
          lesson_id: grupo.lesson_id,
          duration: grupo.duration,
          watched_seconds: tempoAssistido,
          completed
        }, { onConflict: 'user_id,course_id,lesson_id' });

      // Limpar segmentos processados
      await supabase
        .from('progress_segments')
        .delete()
        .eq('user_id', grupo.user_id)
        .eq('course_id', grupo.course_id)
        .eq('lesson_id', grupo.lesson_id);
    }

    return {
      statusCode: 200,
      body: `Consolidação concluída para ${mapa.size} aula(s)`
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: `Erro na consolidação: ${err.message}`
    };
  }
};
