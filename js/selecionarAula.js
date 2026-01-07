import { mostrarNotificacao, atualizarIndicadorLocal } from './utils.js';
import { habilitarQuiz } from './habilitarQuiz.js';
import { initPlayer } from './initPlayer.js';
import { narrar } from './narrativa.js';
import { supabase } from './supabaseClient.js';

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
  // --- 1. LIMPEZA E VALIDAÇÃO DE INTEGRIDADE ---
  if (window.interval) clearInterval(window.interval);
  if (window.timeoutProgressoInicial) clearTimeout(window.timeoutProgressoInicial);

  // Verificação de ID: Garante que estamos a usar o ID da aula e não do curso
  // Se o ID recebido for igual ao course_id, tentamos usar o lesson_id se disponível
  const lessonIdReal = (aula.id === aula.course_id && aula.lesson_id) ? aula.lesson_id : aula.id;

  console.groupCollapsed(`🧭 [selecionarAula] Aula: "${aula.title}" | ID: ${lessonIdReal}`);
  
  // Reset de estados globais
  window.user_id = user_id;
  window.aulaAtual = { ...aula, id: lessonIdReal }; // Força o ID correto no objeto global
  window.maiorTempoVisualizado = 0;
  window.lastTime = 0;
  window.progressoIniciado = false;
  window.aulaFinalizada = false;

  narrar(`📥 Aula selecionada: "${aula.title}"`, "info");

  // Atualização da UI
  esperarElemento("tituloAula", el => el.textContent = aula.title);
  esperarElemento("mensagemAluno", el => {
    el.textContent = "A carregar progresso...";
    el.className = "text-gray-500 italic";
  });

  try {
    // --- 2. BUSCA DE PROGRESSO NO BANCO (RPC) ---
    console.log("📡 Chamando RPC fn_progresso_por_usuario_e_aula...");
    const { data: progresso, error } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
      p_user_id: user_id,
      p_lesson_id: lessonIdReal
    });

    if (error) throw error;

    const dados = Array.isArray(progresso) ? progresso[0] : progresso;

    if (dados) {
      console.log("✅ Dados de progresso recuperados:", dados);
      
      const assistido = dados.segundos_assistidos || 0;
      const total = aula.duration || dados.duracao_total || 0;
      
      // Atualiza interface com progresso real
      atualizarIndicadorLocal(assistido, total);
      
      // Lógica de Quiz e Conclusão
      if (dados.status === '✔ Concluída') {
        window.aulaFinalizada = true;
        habilitarQuiz(true);
        esperarElemento("mensagemAluno", el => {
          el.textContent = "✅ Aula concluída!";
          el.className = "text-green-600 font-bold";
        });
      } else {
        habilitarQuiz(false);
        esperarElemento("mensagemAluno", el => {
          el.textContent = "🕒 Continue assistindo para liberar o quiz";
          el.className = "text-blue-600";
        });
      }

      // Sugestão de Retomada (se assistiu mais de 10s e não terminou)
      if (assistido > 10 && dados.status !== '✔ Concluída') {
        window.pontoRetomada = assistido;
        const minutos = Math.floor(assistido / 60);
        const segundos = assistido % 60;
        const retomadaLabel = `${minutos}m${segundos.toString().padStart(2, '0')}s`;

        const link = document.createElement('div');
        link.className = 'mt-2 text-sm text-blue-600 underline cursor-pointer hover:text-blue-800 transition flex items-center gap-1';
        link.innerHTML = `🔁 Retomar de <strong>${retomadaLabel}</strong>`;
        link.onclick = () => {
          if (!window.player || typeof window.player.seekTo !== 'function') return;
          mostrarNotificacao(`⏩ Saltando para ${retomadaLabel}...`);
          window.player.seekTo(assistido, true);
          setTimeout(() => window.player.playVideo?.(), 500);
        };

        esperarElemento("recomecarSugestao", el => {
          el.innerHTML = ""; 
          el.appendChild(link);
        });
      } else {
        esperarElemento("recomecarSugestao", el => el.innerHTML = "");
      }

    } else {
      console.warn("🚫 Nenhum registro encontrado para este ID de aula no banco.");
      atualizarIndicadorLocal(0, aula.duration);
      esperarElemento("mensagemAluno", el => el.textContent = "Iniciando aula pela primeira vez");
    }

  } catch (err) {
    console.error("❌ Erro ao carregar progresso:", err);
    narrar("Erro ao sincronizar progresso com o servidor.", "error");
  }

  // --- 3. INICIALIZAÇÃO DO PLAYER ---
  console.log("🎬 Iniciando player...");
  initPlayer();

  // Monitor de segurança para garantir que o rastreamento comece
  window.timeoutProgressoInicial = setTimeout(() => {
    if (!window.progressoIniciado && !window.aulaFinalizada) {
      console.warn("⚠️ Rastreamento não iniciado automaticamente.");
    }
  }, 5000);

  console.groupEnd();
}
