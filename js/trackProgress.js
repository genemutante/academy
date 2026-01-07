import { exibirMensagemAluno, narrar } from './narrativa.js';
import { atualizarIndicadorLocal } from './utils.js'; // Certifique-se que este arquivo existe ou ajuste o import
import { supabase } from './supabaseClient.js';
import { habilitarQuiz } from './habilitarQuiz.js'; // Ajuste se necessário
import { listarAulas } from './listarAulas.js';     // Ajuste se necessário
import { carregarProgressoCurso } from './carregarProgressoCurso.js';
import { mostrarTransicaoParaProximaAula } from './mostrarTransicaoParaProximaAula.js'; // Ajuste se necessário

// Variável para evitar salvar repetidamente no mesmo segundo
let ultimoTempoSalvo = -1;

export async function trackProgress() {

  if (window.aulaFinalizada) {
    return;
  }

  const progressoEl = document.getElementById("progressoTexto");
  
  if (!window.player || typeof window.player.getCurrentTime !== 'function') {
    return;
  }

  const tempoAtual = Math.floor(window.player.getCurrentTime());
  
  // 1. Atualiza visualmente a interface (Barra e números)
  if (tempoAtual > window.maiorTempoVisualizado) {
    window.maiorTempoVisualizado = tempoAtual;
    // Se você tiver a função atualizarIndicadorLocal, ela atualiza o HTML
    if (typeof atualizarIndicadorLocal === 'function') {
        atualizarIndicadorLocal(window.maiorTempoVisualizado, window.duration);
    }
  }

  // 2. Lógica de Conclusão (Se passou de 97%)
  const percentual = ((window.maiorTempoVisualizado / window.duration) * 100).toFixed(1);

  if (percentual >= 97 && !window.aulaFinalizada) {
    window.aulaFinalizada = true;
    
    if(progressoEl) progressoEl.textContent = "✅ Aula concluída";
    const recomecarEl = document.getElementById("recomecarSugestao");
    if(recomecarEl) recomecarEl.innerHTML = "";

    narrar("🎉 Aula atingiu 97%. Marcando como concluída.", "success");
    exibirMensagemAluno("✅ Aula concluída! Salvando...", "success");

    // Salva status final no banco
    await salvarNoBanco(tempoAtual, true); 

    // Habilita Quiz e atualiza lista
    if(typeof habilitarQuiz === 'function') await habilitarQuiz(window.aulaAtual.id);
    if(typeof listarAulas === 'function') listarAulas(window.aulas, window.user_id); // Ajuste conforme seus parâmetros
    await carregarProgressoCurso(supabase, window.user_id, window.course_id);

    // Tenta ir para a próxima
    const atualIndex = window.aulas.findIndex(a => a.id === window.aulaAtual.id);
    const proximaAula = window.aulas[atualIndex + 1];
    if (proximaAula && typeof mostrarTransicaoParaProximaAula === 'function') {
      mostrarTransicaoParaProximaAula(proximaAula);
    }
    return;
  }

  // 3. SALVAMENTO PERIÓDICO (O QUE FALTAVA)
  // Salva a cada 10 segundos, mas apenas se o tempo mudou
  if (tempoAtual % 10 === 0 && tempoAtual !== ultimoTempoSalvo && tempoAtual > 0) {
    ultimoTempoSalvo = tempoAtual;
    console.log(`💾 Salvando progresso parcial: ${tempoAtual}s`);
    await salvarNoBanco(tempoAtual, false);
  }
}

// Função auxiliar para comunicar com o Supabase
async function salvarNoBanco(tempo, concluida) {
    if (!window.user_id || !window.aulaAtual?.id) return;

    const status = concluida ? '✔ Concluída' : '🕒 Em andamento';

    // Chama a RPC ou faz UPSERT direto na tabela lesson_progress
    // Estou assumindo que você tem uma tabela lesson_progress ou usa a RPC fn_registrar_progresso
    
    // TENTATIVA 1: Via Tabela (Mais comum)
    const { error } = await supabase
        .from('lesson_progress')
        .upsert({ 
            user_id: window.user_id,
            lesson_id: window.aulaAtual.id,
            last_position: tempo,
            status: status,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, lesson_id' });

    if (error) {
        console.error("Erro ao salvar progresso:", error);
    } else {
        // Atualiza o objeto local para refletir a mudança sem recarregar
        const aulaNaLista = window.aulas.find(a => a.id === window.aulaAtual.id);
        if (aulaNaLista) aulaNaLista.status = status;
    }
}
