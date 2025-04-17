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
icones.className = 'flex w-[32px] shrink-0 justify-start text-base space-x-[2px]';




    if (aula.status === '✔ Concluída') {
      icones.innerHTML += `<span title="Aula assistida">✅</span>`;
    }

    if (aula.quizEnviado) {
      icones.innerHTML += `<span title="Avaliação enviada">📩</span>`;
    }

    const label = document.createElement('span');
    label.textContent = `${aula.order}.` + '\u00A0\u00A0' + aula.title;


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
