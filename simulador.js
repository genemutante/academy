// simulador.js

import { CENARIOS } from './cenarios.js';
import { log } from './logger.js';
import {
  iniciarRelatorio,
  registrarEtapa,
  finalizarRelatorio
} from './relatorio.js';

export async function executarCenario(cenarioSelecionado) {
  const cenario = CENARIOS[cenarioSelecionado];

  if (!cenario) {
    log(`❌ Cenário "${cenarioSelecionado}" não encontrado.`, 'erro');
    return;
  }

  // Início do relatório
  iniciarRelatorio(cenario.titulo, cenario.descricaoTecnica, cenario.descricaoLeiga);

  const user_id = crypto.randomUUID();
  const course_id = crypto.randomUUID();
  const lesson_ids = [];

  log('👤 Criando usuário e curso...');
  registrarEtapa('Usuário e curso de teste criados.', 'Usuário e curso de teste criados.');
  await supabase.from('users').insert({ id: user_id, name: 'Usuário Validador' });
  await supabase.from('courses').insert({
    id: course_id,
    title: 'Curso de Validação Automatizada',
    description: 'Curso gerado para testes de progresso'
  });

  // Criar aulas
  if (cenario.multiaula) {
    for (let i = 0; i < cenario.segmentos.length; i++) {
      const aulaId = crypto.randomUUID();
      lesson_ids.push(aulaId);
      await supabase.from('lessons').insert({
        id: aulaId,
        course_id,
        title: `Aula ${i + 1}`,
        order: i + 1,
        duration: 120,
        youtube_url: 'https://youtu.be/XYZ'
      });
      registrarEtapa(`Aula ${i + 1} criada`, `Aula ${i + 1} criada com ID ${aulaId}`);
    }
  } else {
    const aulaId = crypto.randomUUID();
    lesson_ids.push(aulaId);
    await supabase.from('lessons').insert({
      id: aulaId,
      course_id,
      title: `Aula Única`,
      order: 1,
      duration: 120,
      youtube_url: 'https://youtu.be/XYZ'
    });
    registrarEtapa(`Aula criada`, `Aula criada com ID ${aulaId}`);
  }

  // Inserir segmentos
  log('⏱️ Inserindo segmentos simulados...');
  if (cenario.multiaula) {
    for (let i = 0; i < cenario.segmentos.length; i++) {
      const aulaIndex = cenario.segmentos[i].aula - 1;
      const lesson_id = lesson_ids[aulaIndex];
      for (const s of cenario.segmentos[i].dados) {
        await supabase.from('progress_segments').insert({
          user_id,
          course_id,
          lesson_id,
          duration: 120,
          segment: s
        });
        registrarEtapa(
          `Segmento Aula ${i + 1}: ${s.start}s → ${s.end}s`,
          `Simulado: Aula ${i + 1} | ${s.start}s até ${s.end}s`
        );
      }
    }
  } else {
    const lesson_id = lesson_ids[0];
    for (const s of cenario.segmentos) {
      await supabase.from('progress_segments').insert({
        user_id,
        course_id,
        lesson_id,
        duration: 120,
        segment: s
      });
      registrarEtapa(
        `Segmento: ${s.start}s → ${s.end}s`,
        `Simulado: ${s.start}s até ${s.end}s na aula única`
      );
    }
  }

  // Verificar progresso
  log('📊 Verificando resultados...');
  let sucesso = true;

  if (cenario.multiaula) {
    for (let i = 0; i < lesson_ids.length; i++) {
      const lesson_id = lesson_ids[i];
      const esperado = cenario.esperado[`aula${i + 1}`];

      const { data } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
        p_user_id: user_id,
        p_lesson_id: lesson_id
      });

      if (!data || !data[0]) {
        registrarEtapa(`Aula ${i + 1}: Falha`, `❌ Nenhum dado retornado para Aula ${i + 1}`);
        sucesso = false;
        continue;
      }

      const r = data[0];
      const match =
        r.status === esperado.status &&
        Math.abs(r.segundos_assistidos - esperado.tempo) <= 2;

      registrarEtapa(
        `Aula ${i + 1}: ${match ? '✅ OK' : '❌ Divergência'}`,
        `
        Aula ${i + 1}:
        - Esperado: ${esperado.tempo}s (${esperado.percentual}%) - ${esperado.status}
        - Obtido: ${r.segundos_assistidos}s (${Math.round((r.segundos_assistidos / r.duracao_total) * 100)}%) - ${r.status}
        `
      );

      if (!match) sucesso = false;
    }
  } else {
    const lesson_id = lesson_ids[0];
    const { data } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
      p_user_id: user_id,
      p_lesson_id: lesson_id
    });

    const esperado = cenario.esperado;

    if (!data || !data[0]) {
      registrarEtapa(`❌ Aula única sem retorno`, `Nenhum dado retornado`);
      sucesso = false;
    } else {
      const r = data[0];
      const match =
        r.status === esperado.status &&
        Math.abs(r.segundos_assistidos - esperado.tempo) <= 2;

      registrarEtapa(
        `Resultado: ${match ? '✅ OK' : '❌ Divergência'}`,
        `
        Aula Única:
        - Esperado: ${esperado.tempo}s (${esperado.percentual}%) - ${esperado.status}
        - Obtido: ${r.segundos_assistidos}s (${Math.round((r.segundos_assistidos / r.duracao_total) * 100)}%) - ${r.status}
        `
      );

      if (!match) sucesso = false;
    }
  }

  // Finalizar relatório
  finalizarRelatorio(
    sucesso
      ? '✅ Todos os resultados estão de acordo com o esperado.'
      : '❌ Divergências encontradas. Recomenda-se revisar a função de cálculo de progresso.'
  );
}
