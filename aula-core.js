// aula-core.js

const supabase = window.supabase.createClient(
  'https://bkueljjvhijojzcyodvk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdWVsamp2aGlqb2p6Y3lvZHZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzUwNTQ4OSwiZXhwIjoyMDU5MDgxNDg5fQ.o-G5KmxoyfQjeNM5e7rbgxpryOHYC9k1OIo9fYzyeYE'
);

const url = new URL(location.href);
const user_id = url.searchParams.get('user_id');
const course_id = url.searchParams.get('course_id');

if (!user_id || !course_id) {
  alert('Erro: parâmetros obrigatórios ausentes na URL.');
  throw new Error('Parâmetros user_id e course_id obrigatórios.');
}

const elements = {
  playerFrame: document.getElementById('videoPlayer'),
  loadingVideo: document.getElementById('loadingVideo'),
  tituloCurso: document.getElementById('tituloCurso'),
  descricaoCurso: document.getElementById('descricaoCurso'),
  listaAulas: document.getElementById('listaAulas'),
  tituloAula: document.getElementById('tituloAula'),
  barraProgresso: document.getElementById('barraProgresso'),
  textoProgresso: document.getElementById('textoProgresso'),
  progressoTexto: document.getElementById('progressoTexto'),
  sugestaoRetomada: document.getElementById('recomecarSugestao'),
  btnQuiz: document.getElementById('btnQuiz'),
  btnMaterial: document.getElementById('btnMaterial'),
  popupMaterial: document.getElementById('popupMaterial'),
  nomeAluno: document.getElementById('nomeAluno'),
};

let aulas = [], aulaAtual = null, player = null, interval = null;
let pontoRetomada = null, lastTime = 0, duration = 0;
let maiorTempoVisualizado = 0;

async function carregarCurso() {
  try {
    const { data: curso } = await supabase.from('courses').select('*').eq('id', course_id).single();
    if (curso) {
      elements.tituloCurso.textContent = curso.title;
      elements.descricaoCurso.textContent = curso.description;
    }
  } catch (err) {
    exibirErro(err, 'carregarCurso');
  }
}

async function carregarAulas() {
  try {
    const { data: lista } = await supabase.from('lessons').select('*').eq('course_id', course_id).order('order');
    aulas = lista || [];
    for (const aula of aulas) {
      const { data: progresso } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
        p_user_id: user_id,
        p_lesson_id: aula.id
      });
      aula.status = progresso?.[0]?.status || '🚫 Não Iniciada';

      const { data: quiz } = await supabase
        .from('user_quiz_results')
        .select('id')
        .eq('user_id', user_id)
        .eq('lesson_id', aula.id)
        .limit(1);
      aula.quizEnviado = !!quiz?.length;
    }
  } catch (err) {
    exibirErro(err, 'carregarAulas');
  }
}

function getYouTubeId(url) {
  const match = url.match(/(?:v=|\/embed\/|\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
}

function mostrarNotificacao(msg) {
  const aviso = document.createElement('div');
  aviso.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50 text-sm font-medium';
  aviso.textContent = msg;
  document.body.appendChild(aviso);
  setTimeout(() => aviso.remove(), 2500);
}

function atualizarIndicador(segundos, duracao) {
  const pct = Math.min(100, Math.round((segundos / duracao) * 100));
  elements.progressoTexto.innerHTML = `⏱️ ${segundos}s / ${duracao}s 📊 ${pct}%`;
}

function listarAulas() {
  elements.listaAulas.innerHTML = '';
  let desbloqueadas = true;

  for (const aula of aulas) {
    const li = document.createElement('li');
    li.className = 'flex items-center gap-2 text-gray-700 text-sm px-1';
    li.title = aula.status;

    if (!desbloqueadas) {
      li.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      li.classList.add('cursor-pointer', 'hover:underline');
      li.onclick = () => selecionarAula(aula);
    }

    const icones = document.createElement('div');
    icones.className = 'flex gap-1 w-[34px] justify-start text-base';
    if (aula.status === '✔ Concluída') icones.innerHTML += '✅';
    if (aula.quizEnviado) icones.innerHTML += '📩';

    const label = document.createElement('span');
    label.textContent = `${aula.order}. ${aula.title}`;
    li.appendChild(icones);
    li.appendChild(label);
    elements.listaAulas.appendChild(li);

    if (aula.status !== '✔ Concluída' || !aula.quizEnviado) desbloqueadas = false;
  }
}

function carregarProgressoCurso() {
  supabase.rpc('fn_progresso_curso_por_usuario', {
    p_user_id: user_id,
    p_course_id: course_id
  }).then(({ data }) => {
    if (data?.length) {
      const pct = data[0].percentual_conclusao || 0;
      elements.barraProgresso.style.width = pct + '%';
      elements.textoProgresso.textContent = pct + '%';
    }
  });
}

function exibirErro(erro, contexto) {
  console.error(`❌ [${contexto}]`, erro);
  mostrarNotificacao('⚠️ Erro ao processar dados. Tente novamente.');
}

function carregarNomeAluno() {
  supabase.from('users')
    .select('name')
    .eq('id', user_id)
    .single()
    .then(({ data }) => {
      if (data) elements.nomeAluno.textContent = data.name;
    });
}

window.onYouTubeIframeAPIReady = () => {
  console.log('📺 API do YouTube pronta.');
};

function initPlayer(videoId) {
  if (!window.YT || !YT.Player) {
    console.warn('⏳ Aguardando API do YouTube...');
    setTimeout(() => initPlayer(videoId), 300);
    return;
  }

  elements.playerFrame.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${location.origin}`;

  player = new YT.Player(elements.playerFrame, {
    events: {
      onReady: () => {
        duration = player.getDuration();
        elements.loadingVideo?.remove();
        monitorarProgresso();
      }
    }
  });
}

function monitorarProgresso() {
  interval = setInterval(async () => {
    if (!player || player.getPlayerState() !== YT.PlayerState.PLAYING) return;
    const tempoAtual = Math.floor(player.getCurrentTime());
    if (!Number.isFinite(tempoAtual)) return;

    const diff = tempoAtual - lastTime;
    if (diff <= 0 || diff > 60) return;

    if (tempoAtual > maiorTempoVisualizado) {
      maiorTempoVisualizado = tempoAtual;
      atualizarIndicador(maiorTempoVisualizado, duration);
    }

    const segmento = {
      user_id,
      course_id,
      lesson_id: aulaAtual.id,
      duration: Math.floor(duration),
      segment: { start: lastTime, end: tempoAtual }
    };

    lastTime = tempoAtual;

    try {
      await supabase.from('progress_segments').insert(segmento);
      const { data } = await supabase.rpc('fn_progresso_por_usuario_e_aula', {
        p_user_id: user_id,
        p_lesson_id: aulaAtual.id
      });

      if (data?.[0]?.status === '✔ Concluída') {
        elements.progressoTexto.textContent = '✅ Aula concluída';
        elements.sugestaoRetomada.innerHTML = '';
        await habilitarQuiz(aulaAtual.id);
        carregarProgressoCurso();
        listarAulas();
      }
    } catch (err) {
      exibirErro(err, 'Salvar progresso');
    }
  }, 5000);
}

function selecionarAula(aula) {
  aulaAtual = aula;
  elements.tituloAula.textContent = aula.title;
  clearInterval(interval);
  lastTime = 0;
  maiorTempoVisualizado = 0;

  const videoId = getYouTubeId(aula.youtube_url);
  initPlayer(videoId);
}

function habilitarQuiz(aulaId) {
  supabase.from('user_quiz_results')
    .select('id')
    .eq('user_id', user_id)
    .eq('lesson_id', aulaId)
    .limit(1)
    .then(({ data }) => {
      if (data?.length) {
        elements.btnQuiz.disabled = true;
        elements.btnQuiz.textContent = '✅ Avaliação enviada';
      } else {
        elements.btnQuiz.disabled = false;
        elements.btnQuiz.textContent = '📝 Fazer Avaliação da Aula';
        elements.btnQuiz.onclick = () => abrirQuiz(aulaId);
      }
    });
}

function abrirQuiz(aulaId) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white w-full max-w-2xl h-[90vh] p-4 rounded-xl shadow-xl relative border border-slate-200 overflow-hidden">
      <button onclick="this.parentElement.parentElement.remove()" class="absolute top-3 right-4 text-gray-500 hover:text-red-600 text-xl">&times;</button>
      <iframe src="quiz.html?user_id=${user_id}&lesson_id=${aulaId}" class="w-full h-full rounded-lg border border-slate-200" frameborder="0"></iframe>
    </div>
  `;
  document.body.appendChild(modal);
}

document.addEventListener("DOMContentLoaded", async () => {
  carregarNomeAluno();
  await carregarCurso();
  await carregarAulas();
  listarAulas();
  carregarProgressoCurso();
});
