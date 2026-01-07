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
  // --- 1. LIMPEZA DE ESTADO ANTERIOR ---
  if (window.interval) clearInterval(window.interval);
  if (window.timeoutProgressoInicial) clearTimeout(window.timeoutProgressoInicial);

  // Garante que temos o ID da aula (evita usar o ID do curso)
  const lessonIdReal = (aula.id === aula.course_id && aula.lesson_id) ? aula.lesson_id : aula.id;

  console.groupCollapsed(`🧭 [selecionarAula] Aula: "${aula.title}" | ID: ${lessonIdReal}`);
  
  // Reset de variáveis globais de controlo
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
    el.textContent = "A carregar progresso...";
    el.className = "text-gray-500 italic";
  });

  try {
    // --- 2. BUSCA DE PROGRESSO REAL (RPC) ---
    console.log("📡 A procurar progresso no banco de dados...");
    const { data: progresso, error: errorRPC } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
      p_user_id: user_id,
      p_lesson_id: lessonIdReal
    });

    if (errorRPC) throw errorRPC;

    // --- 3. VERIFICAÇÃO DO QUIZ (Corrigindo o erro do UUID 'true') ---
    const quizRespondido = await verificarQuizRespondido(user_id, lessonIdReal);
    
    const dados = Array.isArray(progresso) ? progresso[0] : progresso;

    if (dados) {
      console.log("✅ Dados de progresso recuperados:", dados);
      
      const assistido = dados.segundos_assistidos || 0;
      const total = aula.duration || dados.duracao_total || 483; // fallback para duração do log
      
      window.pontoRetomada = assistido;
      window.maiorTempoVisualizado = assistido;

      atualizarIndicadorLocal(assistido, total);
      
      // Lógica de Conclusão e Quiz
      if (dados.status === '✔ Concluída') {
        window.aulaFinalizada = true;
        habilitarQuiz(quizRespondido); 
        esperarElemento("mensagemAluno", el => {
          el.textContent = quizRespondido ? "✅ Aula e Quiz concluídos!" : "✅ Aula concluída! Faça o quiz abaixo.";
          el.className = "text-green-600 font-bold";
        });
      } else {
        habilitarQuiz(false);
        esperarElemento("mensagemAluno", el => {
          el.textContent = "🕒 Continue a assistir para libertar o quiz";
          el.className = "text-blue-600";
        });
      }

      // Criar botão de retomada se houver progresso significativo
      if (assistido > 5 && dados.status !== '✔ Concluída') {
        const minutos = Math.floor(assistido / 60);
        const segundos = Math.floor(assistido % 60);
        const tempoFormatado = `${minutos}:${segundos.toString().padStart(2, '0')}`;

        const btnRetomar = document.createElement('button');
        btnRetomar.className = "mt-2 text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition flex items-center gap-1";
        btnRetomar.innerHTML = `<span>🔁 Retomar de ${tempoFormatado}</span>`;
        btnRetomar.onclick = () => {
          if (window.player && window.player.seekTo) {
            window.player.seekTo(assistido, true);
            window.player.playVideo();
            mostrarNotificacao("Vídeo retomado!");
          }
        };
        esperarElemento("recomecarSugestao", el => el.appendChild(btnRetomar));
      }

    } else {
      console.log("🆕 Sem progresso prévio. Iniciando do zero.");
      atualizarIndicadorLocal(0, aula.duration || 0);
    }

  } catch (err) {
    console.error("❌ Erro crítico em selecionarAula:", err);
  }

  // --- 4. INICIALIZAÇÃO DO PLAYER (SÓ APÓS OS DADOS DO BANCO) ---
  console.log(`🎬 Inicializando Player para a aula: ${lessonIdReal}`);
  initPlayer(); 

  console.groupEnd();
}
