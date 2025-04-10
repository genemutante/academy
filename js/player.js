// player.js

import { supabase } from './supabaseClient.js';
import { atualizarIndicadorLocal } from './utils.js';
import { habilitarQuiz } from './quiz.js';
import { listarAulas, carregarProgressoCurso } from './aulaService.js';

let player, interval, lastTime = 0, duration = 0, pontoRetomada = null;

export function configurarPlayer() {
  const videoFrame = document.getElementById('videoPlayer');
  const aula = window.__AULAS__?.find(a => a.selecionada);
  const videoId = getYouTubeId(aula.youtube_url);
  videoFrame.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${location.origin}`;

  loadYouTubeAPI().then(() => {
    player = new YT.Player(videoFrame, {
      events: { onReady: onPlayerReady }
    });
  });
}

function getYouTubeId(url) {
  const match = url.match(/(?:v=|\/embed\/|\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
}

function loadYouTubeAPI() {
  return new Promise(resolve => {
    if (window.YT && window.YT.Player) return resolve();
    window.onYouTubeIframeAPIReady = resolve;
  });
}

async function onPlayerReady() {
  duration = player.getDuration();
  const aula = window.__AULAS__?.find(a => a.selecionada);
  const user_id = new URL(location.href).searchParams.get('user_id');

  const { data: progresso } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
    p_user_id: user_id,
    p_lesson_id: aula.id
  });

  if (progresso?.length > 0) {
    const segundos = progresso[0].segundos_assistidos;
    atualizarIndicadorLocal(segundos, duration);
    pontoRetomada = Math.max(0, segundos - 15);
    player.seekTo(pontoRetomada, true);
    player.playVideo?.();
  }

  lastTime = 0;
  interval = setInterval(() => trackProgress(aula, user_id), 5000);
}

let maiorTempoVisualizado = 0;

async function trackProgress(aula, user_id) {
  if (!player || typeof player.getCurrentTime !== 'function') return;
  const tempoAtual = Math.floor(player.getCurrentTime());
  const diff = tempoAtual - lastTime;

  if (tempoAtual > maiorTempoVisualizado) {
    maiorTempoVisualizado = tempoAtual;
    atualizarIndicadorLocal(maiorTempoVisualizado, duration);
  }

  if (diff <= 0 || diff > 30) return;

  const segmento = {
    user_id,
    course_id: aula.course_id,
    lesson_id: aula.id,
    duration: Math.floor(duration),
    segment: { start: lastTime, end: tempoAtual }
  };

  await supabase.from('progress_segments').insert(segmento);
  lastTime = tempoAtual;

  const { data: progresso, error } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
    p_user_id: user_id,
    p_lesson_id: aula.id
  });

  if (progresso?.[0]?.status === '✔ Concluída') {
    document.getElementById("progressoTexto").textContent = "✅ Aula concluída";
    document.getElementById("recomecarSugestao").innerHTML = "";
    await habilitarQuiz(aula.id);
    aula.status = '✔ Concluída';
    listarAulas();
    carregarProgressoCurso();
  }
}
