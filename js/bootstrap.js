// bootstrap.js

import { trackProgress } from './trackProgress.js';
import { verificarQuizRespondido } from './verificarQuizRespondido.js';
import { carregarDados } from './carregarDados.js';
import { selecionarAula } from './selecionarAula.js';
import { habilitarQuiz } from './habilitarQuiz.js';
import { narrar, exibirMensagemAluno } from './narrativa.js';
import { initPlayer } from './initPlayer.js';
import { onPlayerReady } from './onPlayerReady.js';
import { verificarConclusaoAula } from './verificarConclusaoAula.js';

// 🔌 Supabase client global
window.supabase = window.supabase.createClient(
  'https://bkueljjvhijojzcyodvk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdWVsamp2aGlqb2p6Y3lvZHZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzUwNTQ4OSwiZXhwIjoyMDU5MDgxNDg5fQ.o-G5KmxoyfQjeNM5e7rbgxpryOHYC9k1OIo9fYzyeYE'
);

// 🌐 Params da URL
const url = new URL(location.href);
window.user_id = url.searchParams.get('user_id');
window.course_id = url.searchParams.get('course_id');

// 📦 Exporta funções para o escopo global
window.trackProgress = trackProgress;
window.verificarQuizRespondido = verificarQuizRespondido;
window.carregarDados = carregarDados;
window.selecionarAula = selecionarAula;
window.habilitarQuiz = habilitarQuiz;
window.narrar = narrar;
window.exibirMensagemAluno = exibirMensagemAluno;
window.initPlayer = initPlayer;
window.onPlayerReady = onPlayerReady;
window.verificarConclusaoAula = verificarConclusaoAula;

// 🚀 Execução principal
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const { data: user } = await window.supabase
      .from('users')
      .select('name')
      .eq('id', window.user_id)
      .single();

    if (user) {
      document.getElementById('nomeAluno').textContent = user.name;
    }

    // ✅ Referência de aulas para uso compartilhado
    const aulasRef = { value: [] };
    await window.carregarDados(window.user_id, window.course_id, aulasRef);
  } catch (err) {
    console.error("❌ Erro ao inicializar aplicativo:", err);
    alert("Erro ao carregar dados iniciais. Tente recarregar a página.");
  }
});
