import { narrar } from './narrativa.js';
import { mostrarNotificacao } from './utils.js';
import { trackProgress } from './trackProgress.js';

export function onPlayerReady(event) {
  // 🔐 Timeout de segurança
  window.timeoutProgressoInicial = setTimeout(() => {
    if (!window.progressoIniciado && !window.aulaFinalizada) {
      narrar("⛔ O progresso do vídeo ainda **não começou a ser registrado** após 30 segundos. Isso pode indicar um erro no player ou no Supabase.", "error");
      mostrarNotificacao("❗ Progresso não está sendo salvo. Verifique sua conexão ou recarregue a página.");
    }
  }, 30000);

  console.log('🎬 Player pronto, iniciando monitoramento...');

  if (!window.player || typeof window.player.getDuration !== 'function') {
    console.warn('⚠️ Player inválido, tentando novamente...');
    setTimeout(() => onPlayerReady(event), 300);
    return;
  }

  window.duration = window.player.getDuration();
  console.log('⏱️ Duração total do vídeo:', window.duration);

  // ⏩ Se houver ponto salvo, pula para lá
  if (window.pontoRetomada !== null) {
    console.log('⏩ Retomando do ponto salvo:', window.pontoRetomada);
    window.player.seekTo(window.pontoRetomada, true);
  }

  // ▶️ Sempre tenta iniciar o vídeo, independentemente do ponto
  try {
    window.player.playVideo?.();
    narrar("▶️ Reproduzindo vídeo automaticamente...", "info");
  } catch (e) {
    console.warn("⚠️ Erro ao tentar reproduzir o vídeo:", e);
    mostrarNotificacao("⚠️ Falha ao iniciar o vídeo automaticamente. Reproduza manualmente.");
  }

  // ♻️ Limpa rastreamento anterior
  if (window.interval) clearInterval(window.interval);

  // ⏱️ Inicia novo ciclo de rastreamento
  window.interval = setInterval(trackProgress, 5000);
}
