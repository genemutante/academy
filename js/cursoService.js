export function listarAulas(aulas, selecionarAula) {
  const listaAulas = document.getElementById('listaAulas');
  listaAulas.innerHTML = '';
  let todasAnterioresCompletas = true;

  aulas.forEach((aula, index) => {
    const li = document.createElement('li');
    li.className = 'flex items-center gap-2 text-gray-700 text-sm px-1';

    const podeAcessar = todasAnterioresCompletas;

    const icones = document.createElement('div');
    icones.className = 'flex gap-1 w-[34px] justify-start text-base';

    if (aula.status === '✔ Concluída') {
      icones.innerHTML += `<span title="Aula assistida">✅</span>`;
    }

    if (aula.quizEnviado) {
      icones.innerHTML += `<span title="Avaliação enviada">📩</span>`;
    }

    const label = document.createElement('span');
    label.textContent = `${aula.order}. ${aula.title}`;

    if (podeAcessar) {
      li.classList.add('cursor-pointer', 'hover:underline');
      li.onclick = () => selecionarAula(aula);
    } else {
      li.classList.add('opacity-50', 'cursor-not-allowed');
      li.title = 'Conclua todas as aulas anteriores com avaliação para desbloquear esta';
      li.style.pointerEvents = 'all';
      li.style.transition = 'none';
    }

    li.appendChild(icones);
    li.appendChild(label);

    listaAulas.appendChild(li);

    if (aula.status !== '✔ Concluída' || !aula.quizEnviado) {
      todasAnterioresCompletas = false;
    }
  });
}

export function selecionarAula(aula) {
  // Este é apenas o cabeçalho. O conteúdo completo virá depois,
  // quando revisarmos todo o player.js e separarmos cada parte.
  console.log('🔍 Aula selecionada:', aula.title);
}
