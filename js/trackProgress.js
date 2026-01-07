import { exibirMensagemAluno, narrar } from './narrativa.js';
import { atualizarIndicadorLocal } from './utils.js';
import { supabase } from './supabaseClient.js';
import { carregarProgressoCurso } from './carregarProgressoCurso.js';

// Variáveis de controle de segmento (mantidas em memória durante a aula)
let tempoInicioSegmento = null;
let ultimoTempoVerificado = 0;

export async function trackProgress() {
  // 1. Verificações de segurança
  if (window.aulaFinalizada || !window.player || typeof window.player.getCurrentTime !== 'function') return;

  const tempoAtual = Math.floor(window.player.getCurrentTime());
  const estadoPlayer = window.player.getPlayerState(); // 1 = Tocando, 2 = Pausado, 3 = Buffering

  // 2. Lógica de Início de Segmento (Quando o vídeo começa a tocar)
  if (estadoPlayer === 1 && tempoInicioSegmento === null) {
    tempoInicioSegmento = tempoAtual;
    ultimoTempoVerificado = tempoAtual;
    console.log(`🎬 Segmento iniciado em: ${tempoInicioSegmento}s`);
    return;
  }

  // 3. Lógica de Fechamento de Segmento (Pausa ou Buffering)
  if (estadoPlayer !== 1 && tempoInicioSegmento !== null) {
    console.log("⏸️ Vídeo parado/pausado. Fechando segmento...");
    await fecharESalvarSegmento(tempoAtual);
    return;
  }

  // 4. Lógica de Monitoramento durante a reprodução
  if (tempoInicioSegmento !== null) {
    // Detectar Pulos (Se a diferença de tempo for maior que 2s, o aluno usou o scroll)
    const saltou = Math.abs(tempoAtual - ultimoTempoVerificado) > 2;
    
    if (saltou) {
      console.log("⏩ Pulo detectado! Salvando trecho anterior e iniciando novo.");
      await fecharESalvarSegmento(ultimoTempoVerificado);
      tempoInicioSegmento = tempoAtual;
    } 
    // Salvamento Periódico (A cada 10 segundos assistidos para não perder progresso)
    else if (tempoAtual - tempoInicioSegmento >= 10) {
      await fecharESalvarSegmento(tempoAtual);
      tempoInicioSegmento = tempoAtual;
    }
  }

  // Atualiza o tempo para a próxima verificação
  ultimoTempoVerificado = tempoAtual;

  // 5. Verificação visual de Conclusão (97%)
  const percentual = ((window.maiorTempoVisualizado / window.duration) * 100).toFixed(1);
  if (percentual >= 97 && !window.aulaFinalizada) {
    // Nota: O status de "Concluída" será calculado pelo seu SQL baseado nos segmentos.
    // Aqui apenas damos o feedback visual imediato.
    const progressoEl = document.getElementById("progressoTexto");
    if (progressoEl) progressoEl.textContent = "✅ Aula concluída";
  }
}

/**
 * Grava o intervalo assistido na tabela progress_segments
 */
async function fecharESalvarSegmento(tempoFim) {
  if (tempoInicioSegmento === null) return;
  
  // Garante que o start seja menor que o end
  const segmento = {
    start: Math.min(tempoInicioSegmento, tempoFim),
    end: Math.max(tempoInicioSegmento, tempoFim)
  };

  // Previne gravar segmentos de 0 segundos
  if (segmento.start === segmento.end) {
    tempoInicioSegmento = null;
    return;
  }

  console.log(`💾 Salvando intervalo assistido: [${segmento.start} - ${segmento.end}]`);

  // Reset imediato para evitar duplicidade em chamadas assíncronas
  tempoInicioSegmento = null;

  const { error } = await supabase
    .from('progress_segments')
    .insert({
      user_id: window.user_id,
      course_id: window.course_id,
      lesson_id: window.aulaAtual.id,
      duration: window.duration || 0,
      segment: segmento
    });

  if (error) {
    console.error("❌ Erro ao salvar segmento no Supabase:", error);
  } else {
    // Atualiza a barra de progresso do curso usando sua função original
    // Isso invocará sua RPC fn_progresso_curso_por_usuario
    await carregarProgressoCurso(supabase, window.user_id, window.course_id);
  }
}
