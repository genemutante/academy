// onPlayerReady.js
import { narrar } from './narrativa.js';
import { mostrarNotificacao } from './utils.js';
import { trackProgress } from './trackProgress.js';

export function onPlayerReady(event) {
  timeoutProgressoInicial = setTimeout(() => {
    if (!progressoIniciado) {
      narrar("⛔ O progresso do vídeo ainda **não começou a ser registrado** após 30 segundos. Isso pode indicar um erro no player ou no Supabase.", "error");
      mostrarNotificacao("❗ Progresso não está sendo salvo. Verifique sua conexão ou recarregue a página.");
    }
  }, 30000);

  console.log('🎬 Player pronto, iniciando monitoramento...');

  if (!player || typeof player.getDuration !== 'function') {
    console.warn('⚠️ Player inválido, tentando novamente...');
    setTimeout(() => onPlayerReady(event), 300);
    return;
  }

  duration = player.getDuration();
  console.log('⏱️ Duração total do vídeo:', duration);

  if (pontoRetomada !== null) {
    console.log('⏩ Retomando do ponto:', pontoRetomada);
    player.seekTo(pontoRetomada, true);
    player.playVideo?.();
  }

  interval = setInterval(trackProgress, 5000);
}
