import { trackProgress } from './trackProgress.js';

let player, aulaAtual, user_id, course_id;
let lastTime = 0;
let maiorTempoVisualizado = 0;
let progressoIniciado = false;
let narrativaCiclosExecutados = 0;
let narrativaMaxCiclos = 5;
let pontoRetomada = null;
let duration = 0;

// Exemplo de uso
setInterval(async () => {
  const result = await trackProgress({
    player,
    aulaAtual,
    user_id,
    course_id,
    duration,
    lastTime,
    maiorTempoVisualizado,
    progressoIniciado,
    narrativaCiclosExecutados,
    narrativaMaxCiclos,
    pontoRetomada
  });

  if (result) {
    lastTime = result.lastTime;
    maiorTempoVisualizado = result.maiorTempoVisualizado;
  }
}, 5000);
