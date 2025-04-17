export function carregarProgressoCurso() {
  const barra = document.getElementById("barraProgresso");
  const texto = document.getElementById("textoProgresso");

  const aulas = window.aulas || [];

  if (!Array.isArray(aulas) || aulas.length === 0) {
    console.warn("⚠️ Nenhuma aula disponível para cálculo de progresso.");
    return;
  }

  let pontos = 0;
  const totalPontos = aulas.length * 2; // 1 ponto por aula assistida + 1 ponto por quiz

  aulas.forEach(aula => {
    if (aula.status === '✔ Concluída') pontos++;       // 1 ponto por assistir tudo
    if (aula.quizEnviado === true) pontos++;           // 1 ponto por enviar quiz
  });

  const percentual = Math.floor((pontos / totalPontos) * 100);

  if (barra) barra.style.width = `${percentual}%`;
  if (texto) texto.textContent = `${percentual}%`;

  console.log(`📊 Progresso do curso: ${pontos}/${totalPontos} pontos = ${percentual}%`);
}
