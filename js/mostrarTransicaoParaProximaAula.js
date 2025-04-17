// js/mostrarTransicaoParaProximaAula.js

export function mostrarTransicaoParaProximaAula(proximaAula, selecionarAula) {
  const msg = document.createElement('div');
  msg.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-fade-in";

  msg.innerHTML = `
    <div class="bg-white px-6 py-4 rounded-xl shadow-xl text-center space-y-2 max-w-md w-full">
      <h2 class="text-lg font-semibold text-gray-800">✅ Avaliação enviada!</h2>
      <p class="text-sm text-gray-600">Carregando a próxima aula: <strong>${proximaAula.title}</strong></p>
      <p class="text-sm text-blue-600 font-mono" id="contadorRedirecionamento">Em 5 segundos...</p>
    </div>
  `;

  document.body.appendChild(msg);

  let segundos = 5;
  const label = msg.querySelector("#contadorRedirecionamento");

  const intervalo = setInterval(() => {
    segundos--;

    if (segundos <= 0) {
      clearInterval(intervalo);
      msg.remove();

      if (typeof selecionarAula === "function") {
        window.location.href = `/curso/${window.course_id}/aula/${proximaAula.id}`;

      } else {
        console.warn("⚠️ selecionarAula não é uma função válida.");
      }

    } else {
      if (label) {
        label.textContent = `Em ${segundos} segundo${segundos === 1 ? '' : 's'}...`;
      }
    }
  }, 1000);
}
