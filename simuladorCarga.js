document.addEventListener('DOMContentLoaded', () => {
  const alunos = document.getElementById('numAlunos');
  const cursos = document.getElementById('numCursos');
  const aulas = document.getElementById('aulasPorCurso');
  const duracao = document.getElementById('duracaoMinutos');
  const frag = document.getElementById('fatorFragmentacao');
  const out = document.getElementById('resultadoCarga');

  function simular() {
    const nAlunos = parseInt(alunos.value);
    const nCursos = parseInt(cursos.value);
    const nAulas = parseInt(aulas.value);
    const durSeg = parseInt(duracao.value) * 60;
    const fragMult = 1 + parseInt(frag.value) / 100;

    const registrosPorAula = Math.ceil(durSeg / 5 * fragMult);
    const totalAulas = nCursos * nAulas;
    const totalPorAluno = registrosPorAula * totalAulas;
    const totalGeral = totalPorAluno * nAlunos;

    const estimativaEspacoMB = (totalGeral * 0.5) / (1024 * 1024); // cada registro ~0.5KB

    out.innerText = `
📚 Aulas por curso: ${nAulas}
⏱️ Duração por aula: ${durSeg}s
🔁 Fragmentação: x${fragMult.toFixed(2)}

📍 Estimativas:

👤 Registros por aluno: ~${totalPorAluno.toLocaleString()}
🧾 Registros totais: ~${totalGeral.toLocaleString()} registros
💾 Espaço estimado: ~${estimativaEspacoMB.toFixed(2)} MB

✅ Banco comporta esse volume? ${totalGeral < 100_000_000 ? "Sim 👍" : "⚠️ Exige atenção"}

📌 Recomendações:
- Indexar user_id, lesson_id, segment
- Considerar rotinas de merge de segmentos antigos
- Monitorar crescimento por tenant
`.trim();
  }

  document.querySelectorAll('#formSimulador input').forEach(input =>
    input.addEventListener('input', simular)
  );

  simular(); // roda ao abrir
});
