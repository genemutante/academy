// onPlayerReady.js
import { narrar } from './narrativa.js';
import { mostrarNotificacao } from './utils.js';
import { trackProgress } from './trackProgress.js';

export function onPlayerReady(event) {
  window.timeoutProgressoInicial = setTimeout(() => {
    if (!window.progressoIniciado) {
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

  // ✅ Corrigido: define a duração corretamente
  window.duration = window.player.getDuration();
  console.log('⏱️ Duração total do vídeo:', window.duration);

  // ⏩ Pula para ponto salvo, se houver
  if (window.pontoRetomada !== null) {
    console.log('⏩ Retomando do ponto:', window.pontoRetomada);
    window.player.seekTo(window.pontoRetomada, true);
    window.player.playVideo?.();
  }

  // 🧹 Limpa intervalos anteriores
  if (window.interval) clearInterval(window.interval);

  // ⏱️ Inicia rastreamento do progresso
  window.interval = setInterval(trackProgress, 5000);
}
