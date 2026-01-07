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
    // Garante que o status existe antes de comparar
    if (aula && aula.status === '✔ Concluída') pontos++;       
    if (aula && aula.quizEnviado === true) pontos++;           
  });

  const percentual = Math.floor((pontos / totalPontos) * 100);

  if (barra) barra.style.width = `${percentual}%`;
  if (texto) texto.textContent = `${percentual}%`;

  console.log(`📊 Progresso do curso: ${pontos}/${totalPontos} pontos = ${percentual}%`);
}
