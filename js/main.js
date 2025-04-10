// main.js
import { carregarDados, carregarNomeAluno } from './aulaService.js';
import { configurarPlayer } from './player.js';
import { configurarProgresso } from './progresso.js';
import { configurarQuiz } from './quiz.js';
import { configurarMaterial } from './utils.js';

// Inicialização principal da tela de aula
document.addEventListener("DOMContentLoaded", async () => {
  await carregarDados();
  await carregarNomeAluno();
  configurarPlayer();
  configurarProgresso();
  configurarQuiz();
  configurarMaterial();
});
