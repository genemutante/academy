import { mostrarNotificacao, atualizarIndicadorLocal } from './utils.js';
import { habilitarQuiz } from './habilitarQuiz.js';
import { initPlayer } from './initPlayer.js';
import { narrar } from './narrativa.js';
import { supabase } from './supabaseClient.js';
import { verificarQuizRespondido } from './verificarQuizRespondido.js';

function esperarElemento(id, callback) {
  const el = document.getElementById(id);
  if (el) return callback(el);

  const observer = new MutationObserver(() => {
    const el = document.getElementById(id);
    if (el) {
      observer.disconnect();
      callback(el);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

export async function selecionarAula(aula, user_id) {
  // --- 1. LIMPEZA E DEFINIÇÃO DE IDs ---
  if (window.interval) clearInterval(window.interval);
  if (window.timeoutProgressoInicial) clearTimeout(window.timeoutProgressoInicial);

  // Garante que temos o ID real da aula (UUID)
  const lessonIdReal = (aula.id === aula.course_id && aula.lesson_id) ? aula.lesson_id : aula.id;

  console.groupCollapsed(`🧭 [selecionarAula] Aula: "${aula.title}" | ID: ${lessonIdReal}`);
  
  // Configuração de variáveis globais de controle
  window.user_id = user_id;
  window.aulaAtual = { ...aula, id: lessonIdReal }; 
  window.pontoRetomada = 0;
  window.maiorTempoVisualizado = 0;
  window.lastTime = 0;
  window.progressoIniciado = false;
  window.aulaFinalizada = false;

  narrar(`📥 Aula selecionada: "${aula.title}"`, "info");

  // Reset da Interface
  esperarElemento("tituloAula", el => el.textContent = aula.title);
  esperarElemento("recomecarSugestao", el => el.innerHTML = "");
  esperarElemento("mensagemAluno", el => {
    el.textContent = "Carregando progresso...";
    el.className = "text-gray-500 italic";
  });

  try {
    // --- 2. BUSCA DE PROGRESSO E QUIZ ---
    console.log("📡 Buscando dados no banco...");
    
    // Chamada RPC para pegar progresso
    const { data: progresso, error: errorRPC } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
      p_user_id: user_id,
      p_lesson_id: lessonIdReal
    });

    if (errorRPC) throw errorRPC;

    // CHAMADA CORRIGIDA: Passando o ID da aula e não o status
    const quizRespondido = await verificarQuizRespondido(user_id, lessonIdReal);
    
    const dados = Array.isArray(progresso) ? progresso[0] : progresso;

    if (dados) {
      const total = aula.duration || dados.duracao_total || 0;
      let assistido = dados.segundos_assistidos || 0;
      
      // Se o status for concluído, forçamos o indicador para o total
      if (dados.status === '✔ Concluída') {
        window.aulaFinalizada = true;
        assistido = total;
        
        // Habilita o Quiz passando o ID da aula
        await habilitarQuiz(lessonIdReal); 

        esperarElemento("mensagemAluno", el => {
          el.textContent = quizRespondido ? "✅ Aula e Avaliação concluídas!" : "✅ Aula concluída! Responda o quiz abaixo.";
          el.className = "text-green-600 font-bold";
        });
      } else {
        esperarElemento("mensagemAluno", el => {
          el.textContent = "🕒 Assista ao vídeo para liberar a avaliação";
          el.className = "text-blue-600";
        });
      }

      window.pontoRetomada = assistido;
      window.maiorTempoVisualizado = assistido;
      atualizarIndicadorLocal(assistido, total);

      // Botão de Retomada (apenas se não estiver concluída)
      if (assistido > 5 && !window.aulaFinalizada) {
        const tempoFmt = `${Math.floor(assistido / 60)}:${(assistido % 60).toString().padStart(2, '0')}`;
        const btn = document.createElement('button');
        btn.className = "mt-2 text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition flex items-center gap-1";
        btn.innerHTML = `<span>🔁 Retomar de ${tempoFmt}</span>`;
        btn.onclick = () => {
          if (window.player?.seekTo) {
            window.player.seekTo(assistido, true);
            window.player.playVideo();
            mostrarNotificacao("Vídeo retomado!");
          }
        };
        esperarElemento("recomecarSugestao", el => el.appendChild(btn));
      }

    } else {
      console.log("🆕 Sem progresso registrado. Iniciando do zero.");
      atualizarIndicadorLocal(0, aula.duration || 0);
    }

  } catch (err) {
    console.error("❌ Erro em selecionarAula:", err);
  }

  // --- 3. INICIALIZAÇÃO DO PLAYER ---
  // IMPORTANTE: Só inicializa após o await do banco para window.pontoRetomada estar pronto
  console.log(`🎬 Inicializando player para ID: ${lessonIdReal}`);
  initPlayer(); 

  console.groupEnd();
}
