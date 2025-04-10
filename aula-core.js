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
    console.error('❌ Erro ao carregar curso:', err);
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
    console.error('❌ Erro ao carregar aulas:', err);
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

// Continuação será adicionada com lógica completa do player, quiz, tracking e retomada.
