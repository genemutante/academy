import { selecionarAula } from './selecionarAula.js';

export function listarAulas(aulas, user_id) {
  const listaAulas = document.getElementById("listaAulas");
  listaAulas.innerHTML = '';

  let liberarProxima = true;

  aulas.forEach((aula) => {
    const li = document.createElement('li');
    li.className = 'flex items-center gap-2 text-gray-700 text-sm px-1';

    const podeAcessar = liberarProxima;

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
      li.onclick = () => selecionarAula(aula, user_id);
    } else {
      li.classList.add('opacity-50', 'cursor-not-allowed');
      li.title = 'Conclua todas as aulas anteriores e a avaliação para desbloquear esta';
    }

    li.appendChild(icones);
    li.appendChild(label);
    listaAulas.appendChild(li);

    if (!(aula.status === '✔ Concluída' && aula.quizEnviado)) {
      liberarProxima = false;
    }
  });
}
