import { supabase } from './supabaseClient.js';
import { atualizarIndicadorLocal } from './utils.js';
import { habilitarQuiz } from './habilitarQuiz.js';
import { exibirMensagemAluno, narrar } from './narrativa.js';
import { listarAulas } from './listarAulas.js';
import { carregarProgressoCurso } from './carregarProgressoCurso.js';
import { mostrarTransicaoParaProximaAula } from './mostrarTransicaoParaProximaAula.js';

export function configurarTrackProgress(controle) {
  window.aulaAtual = controle.aulaAtual;
  window.duration = controle.duration;
  window.player = controle.player;
  window.maiorTempoVisualizado = controle.maiorTempoVisualizado;
  window.lastTime = controle.lastTime;
  window.pontoRetomada = controle.pontoRetomada;
  window.user_id = controle.user_id;
  window.course_id = controle.course_id;
  window.aulas = controle.aulas;
}

export async function trackProgress() {
  const progressoEl = document.getElementById("progressoTexto");
  const mensagemEl = document.getElementById("mensagemAluno");

  if (!window.player || typeof window.player.getCurrentTime !== 'function') {
    narrar("⚠️ O player ainda não está pronto ou inválido. Ciclo cancelado.", "warning");
    return;
  }

  const tempoAtual = Math.floor(window.player.getCurrentTime());
  const diff = tempoAtual - window.lastTime;

  console.log(`⏱️ Tempo atual: ${tempoAtual}s | Último salvo: ${window.lastTime}s | Diferença: ${diff}s`);

  if (!window.progressoIniciado && tempoAtual < 10) {
    narrar("🕓 Ignorando rastreamento inicial: tempo ainda muito curto para validação.", "info");
    return;
  }

  if (diff < 0 && window.maiorTempoVisualizado === 0) {
    narrar("↩️ Tempo voltou nos primeiros segundos. Ignorando por segurança.", "info");
    return;
  }

  if (window.narrativaCiclosExecutados < window.narrativaMaxCiclos) {
    window.narrativaCiclosExecutados++;
    narrar(`📍 Rastreamento válido: ${tempoAtual}s (diff: ${diff})`);
  }

  if (diff <= 0 || diff > 30) {
    const tipo = diff < 0 ? "voltou" : "adiantou";
    const msg = diff < 0
      ? "🔄 Você voltou para rever um trecho. Rastreamento será retomado logo após."
      : "⏭️ Você adiantou o vídeo. Rastreamento retomará após fluxo normal.";
    exibirMensagemAluno(msg, "info");
    narrar(`⏸️ Rastreamento pausado porque o aluno ${tipo} o vídeo.`, "info");
    return;
  }

  window.progressoIniciado = true;
  window._tempoInicioAguardoProgresso = null;

  if (mensagemEl) {
    mensagemEl.textContent = "";
    mensagemEl.className = "text-sm text-blue-700";
  }

  if (progressoEl && (progressoEl.innerText.includes("Aguardando") || progressoEl.innerText.includes("Carregando"))) {
    progressoEl.textContent = "";
    atualizarIndicadorLocal(window.maiorTempoVisualizado, window.duration);
    exibirMensagemAluno("✅ Rastreamento em andamento!", "success");
    narrar("✅ Progresso iniciado com sucesso. Indicador visual atualizado.", "success");
  }

  const segmento = {
    user_id: window.user_id,
    course_id: window.course_id,
    lesson_id: window.aulaAtual.id,
    duration: Math.floor(window.duration),
    segment: { start: window.lastTime, end: tempoAtual }
  };

  const { error } = await supabase.from('progress_segments').insert(segmento);
  if (error) {
    narrar(`❌ Erro ao salvar segmento: ${error.message}`, "error");
    return;
  }

  window.lastTime = tempoAtual;

  if (window.pontoRetomada !== null && tempoAtual > window.pontoRetomada + 5) {
    const sugestaoEl = document.getElementById("recomecarSugestao");
    if (sugestaoEl && sugestaoEl.innerHTML.trim() !== "") {
      sugestaoEl.innerHTML = "";
      window.pontoRetomada = null;
      narrar("🔄 Ocultando sugestão de retomada: ponto já ultrapassado.", "info");
    }
  }

  if (tempoAtual > window.maiorTempoVisualizado) {
    window.maiorTempoVisualizado = tempoAtual;
    atualizarIndicadorLocal(window.maiorTempoVisualizado, window.duration);
  }

  const percentual = ((window.maiorTempoVisualizado / window.duration) * 100).toFixed(1);

  if (percentual >= 97) {
    progressoEl.textContent = "✅ Aula concluída";
    document.getElementById("recomecarSugestao").innerHTML = "";
    await habilitarQuiz(window.aulaAtual.id);
    listarAulas();
    carregarProgressoCurso();
    exibirMensagemAluno("✅ Aula concluída! A próxima começará em 5 segundos...", "success");

    const atualIndex = window.aulas.findIndex(a => a.id === window.aulaAtual.id);
    const proximaAula = window.aulas[atualIndex + 1];
    if (proximaAula) {
      mostrarTransicaoParaProximaAula(proximaAula);
    } else {
      exibirMensagemAluno("🏁 Fim do curso. Parabéns!", "success");
    }
  }
}
