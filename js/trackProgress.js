import { supabase } from './supabaseClient.js';
import { atualizarIndicadorLocal } from './utils.js';
import { habilitarQuiz } from './habilitarQuiz.js';
import { exibirMensagemAluno, narrar } from './narrativa.js';
import { listarAulas, carregarProgressoCurso } from './carregarDados.js';
import { mostrarTransicaoParaProximaAula } from './selecionarAula.js';

export async function trackProgress({ player, aulaAtual, user_id, course_id, duration, lastTime, maiorTempoVisualizado, progressoIniciado, narrativaCiclosExecutados, narrativaMaxCiclos, pontoRetomada }) {
  console.log("📡 trackProgress iniciado!");

  const progressoEl = document.getElementById("progressoTexto");
  const mensagemEl = document.getElementById("mensagemAluno");

  if (!player || typeof player.getCurrentTime !== 'function') {
    narrar("⚠️ O player ainda não está pronto ou inválido. Ciclo cancelado.", "warning");
    return { lastTime, maiorTempoVisualizado };
  }

  const tempoAtual = Math.floor(player.getCurrentTime());
  const diff = tempoAtual - lastTime;

  console.log(`⏱️ Tempo atual: ${tempoAtual}s | Último salvo: ${lastTime}s | Diferença: ${diff}s`);

  if (!progressoIniciado && tempoAtual < 10) {
    narrar("🕓 Ignorando rastreamento inicial: tempo ainda muito curto para validação.", "info");
    return { lastTime, maiorTempoVisualizado };
  }

  if (diff < 0 && maiorTempoVisualizado === 0) {
    narrar("↩️ Tempo voltou nos primeiros segundos. Ignorando por segurança.", "info");
    return { lastTime, maiorTempoVisualizado };
  }

  if (narrativaCiclosExecutados < narrativaMaxCiclos) {
    narrativaCiclosExecutados++;
    narrar(`📍 Rastreamento válido: ${tempoAtual}s (diff: ${diff})`);
  }

  if (diff <= 0 || diff > 30) {
    const tipo = diff < 0 ? "voltou" : "adiantou";
    const msg = tipo === "voltou"
      ? "🔄 Você voltou para rever um trecho. Rastreamento será retomado logo após."
      : "⏭️ Você adiantou o vídeo. Rastreamento retomará após fluxo normal.";
    exibirMensagemAluno(msg, "info");
    narrar(`⏸️ Rastreamento pausado porque o aluno ${tipo} o vídeo.`, "info");
    return { lastTime, maiorTempoVisualizado };
  }

  progressoIniciado = true;
  window._tempoInicioAguardoProgresso = null;

  if (mensagemEl) {
    mensagemEl.textContent = "";
    mensagemEl.className = "text-sm text-blue-700";
  }

  if (progressoEl && (progressoEl.innerText.includes("Aguardando") || progressoEl.innerText.includes("Carregando"))) {
    progressoEl.textContent = "";
    atualizarIndicadorLocal(maiorTempoVisualizado, duration);
    exibirMensagemAluno("✅ Rastreamento em andamento!", "success");
    narrar("✅ Progresso iniciado com sucesso. Indicador visual atualizado.", "success");
  }

  const segmento = {
    user_id,
    course_id,
    lesson_id: aulaAtual.id,
    duration: Math.floor(duration),
    segment: { start: lastTime, end: tempoAtual }
  };

  const { error } = await supabase.from('progress_segments').insert(segmento);
  if (error) {
    narrar(`❌ Erro ao salvar segmento: ${error.message}`, "error");
    return { lastTime, maiorTempoVisualizado };
  }

  lastTime = tempoAtual;

  if (pontoRetomada !== null && tempoAtual > pontoRetomada + 5) {
    const sugestaoEl = document.getElementById("recomecarSugestao");
    if (sugestaoEl && sugestaoEl.innerHTML.trim() !== "") {
      sugestaoEl.innerHTML = "";
      pontoRetomada = null;
      narrar("🔄 Ocultando sugestão de retomada: ponto já ultrapassado.", "info");
    }
  }

  if (tempoAtual > maiorTempoVisualizado) {
    maiorTempoVisualizado = tempoAtual;
    atualizarIndicadorLocal(maiorTempoVisualizado, duration);
  }

  const percentual = ((maiorTempoVisualizado / duration) * 100).toFixed(1);

  if (percentual >= 97) {
    progressoEl.textContent = "✅ Aula concluída";
    document.getElementById("recom
