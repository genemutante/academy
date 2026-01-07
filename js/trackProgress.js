import { supabase } from './supabaseClient.js';
import { narrar } from './narrativa.js';
import { carregarProgressoCurso } from './carregarProgressoCurso.js';

// Variáveis de controle de segmento
let tempoInicioSegmento = null;
let ultimoTempoVerificado = 0;

export async function trackProgress() {
  if (window.aulaFinalizada || !window.player || typeof window.player.getCurrentTime !== 'function') return;

  const tempoAtual = Math.floor(window.player.getCurrentTime());
  const estadoPlayer = window.player.getPlayerState(); // 1 = Reproduzindo, 2 = Pausado

  // Se o player não estiver reproduzindo, paramos o segmento atual
  if (estadoPlayer !== 1) {
    if (tempoInicioSegmento !== null) {
      await fecharESalvarSegmento(tempoAtual);
    }
    return;
  }

  // Se o player começou a tocar agora, iniciamos o tempo de início
  if (tempoInicioSegmento === null) {
    tempoInicioSegmento = tempoAtual;
    ultimoTempoVerificado = tempoAtual;
    return;
  }

  // Detectar Pulos (Se a diferença entre o tempo atual e o último verificado for > 2 segundos)
  const saltou = Math.abs(tempoAtual - ultimoTempoVerificado) > 2;

  if (saltou) {
    console.log("⏩ Pulo detectado. Fechando segmento anterior e iniciando novo.");
    await fecharESalvarSegmento(ultimoTempoVerificado);
    tempoInicioSegmento = tempoAtual;
  }

  // Salvamento por Intervalo (A cada 10 segundos de visualização contínua)
  if (tempoAtual - tempoInicioSegmento >= 10) {
    await fecharESalvarSegmento(tempoAtual);
    tempoInicioSegmento = tempoAtual; // Reinicia o início para o próximo bloco
  }

  ultimoTempoVerificado = tempoAtual;
  
  // Atualiza maior tempo para lógica de 97% (opcional, já que o SQL faz o cálculo real)
  if (tempoAtual > window.maiorTempoVisualizado) {
      window.maiorTempoVisualizado = tempoAtual;
  }
}

async function fecharESalvarSegmento(tempoFim) {
  if (tempoInicioSegmento === null || tempoInicioSegmento === tempoFim) return;

  const segmento = {
    start: Math.min(tempoInicioSegmento, tempoFim),
    end: Math.max(tempoInicioSegmento, tempoFim)
  };

  tempoInicioSegmento = null; // Reset imediato para evitar duplicidade

  console.log(`💾 Gravando segmento: [${segmento.start}s - ${segmento.end}s]`);

  const { error } = await supabase
    .from('progress_segments')
    .insert({
      user_id: window.user_id,
      course_id: window.course_id,
      lesson_id: window.aulaAtual.id,
      duration: window.duration || 0,
      segment: segmento // Coluna JSONB
    });

  if (error) {
    console.error("❌ Erro ao gravar segmento:", error);
  } else {
    // Após gravar, atualizamos o progresso geral na tela chamando sua RPC
    await atualizarInterfaceProgresso();
  }
}

async function atualizarInterfaceProgresso() {
    // Aqui você chama a função carregarProgressoCurso que você já tem
    // Ela vai rodar o SQL fn_progresso_curso_por_usuario e atualizar a barra
    await carregarProgressoCurso(supabase, window.user_id, window.course_id);
}
