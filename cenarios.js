// cenarios.js

export const CENARIOS = {
  simples: {
    titulo: "Simples - Sem sobreposição",
    descricaoTecnica: "3 blocos contínuos de visualização: 0–30s, 30–60s, 60–90s. Sem sobreposição.",
    descricaoLeiga: "A pessoa assistiu o vídeo direto, sem pausar ou voltar. Foi do começo até 90 segundos de forma fluida.",
    segmentos: [
      { start: 0, end: 30 },
      { start: 30, end: 60 },
      { start: 60, end: 90 }
    ],
    esperado: {
      tempo: 90,
      status: "🕒 Em andamento",
      percentual: 75
    }
  },

  intermediario: {
    titulo: "Intermediário - Com sobreposição",
    descricaoTecnica: "Segmentos com interseções: 0–20s, 15–40s, 39–60s. Total real: 60s.",
    descricaoLeiga: "A pessoa começou a assistir, voltou um pouquinho, depois avançou. Assistiu parte repetida.",
    segmentos: [
      { start: 0, end: 20 },
      { start: 15, end: 40 },
      { start: 39, end: 60 }
    ],
    esperado: {
      tempo: 60,
      status: "🕒 Em andamento",
      percentual: 50
    }
  },

  avancado: {
    titulo: "Avançado - Troca de aula + sobreposição",
    descricaoTecnica: "Assiste 0–30s da aula 1, pausa. Vai para aula 2, assiste 0–60s. Volta pra aula 1, assiste 20–90s.",
    descricaoLeiga: "A pessoa começou uma aula, saiu no meio, foi pra outra, assistiu metade, voltou pra primeira e terminou.",
    multiaula: true,
    segmentos: [
      {
        aula: 1,
        dados: [{ start: 0, end: 30 }]
      },
      {
        aula: 2,
        dados: [{ start: 0, end: 60 }]
      },
      {
        aula: 1,
        dados: [{ start: 20, end: 90 }]
      }
    ],
    esperado: {
      aula1: { tempo: 90, percentual: 75, status: "🕒 Em andamento" },
      aula2: { tempo: 60, percentual: 50, status: "🕒 Em andamento" }
    }
  },

  forcaBruta: {
    titulo: "Força Bruta - Estresse com 100 segmentos",
    descricaoTecnica: "100 segmentos aleatórios com sobreposições, reversos e gaps. Duração fictícia de 300s.",
    descricaoLeiga: "Teste de pancadaria. É como se 10 pessoas estivessem mexendo no vídeo ao mesmo tempo.",
    segmentos: Array.from({ length: 100 }, () => {
      const start = Math.floor(Math.random() * 290);
      const end = start + Math.floor(Math.random() * 10) + 1;
      return { start, end: Math.min(end, 300) };
    }),
    esperado: {
      tempo: '≈ variável',
      percentual: '≈ variável',
      status: '⚠️ Avaliação manual'
    }
  },

  avancado2: {
    titulo: "Avançado 2 - Aula com sobreposição precisa + troca de aula",
    descricaoTecnica:
      "Aluno assiste 0–30s da Aula 1, depois 20–50s da mesma aula (sobreposição de 10s). Em seguida, assiste 0–60s da Aula 2.",
    descricaoLeiga:
      "A pessoa começou a ver uma aula, voltou um pouco e repetiu parte dela. Depois trocou pra outra aula e assistiu metade.",
    multiaula: true,
    segmentos: [
      {
        aula: 1,
        dados: [
          { start: 0, end: 30 },
          { start: 20, end: 50 }
        ]
      },
      {
        aula: 2,
        dados: [
          { start: 0, end: 60 }
        ]
      }
    ],
    esperado: {
      aula1: {
        tempo: 50,
        percentual: 41.7,
        status: "🕒 Em andamento"
      },
      aula2: {
        tempo: 60,
        percentual: 50,
        status: "🕒 Em andamento"
      }
    }
  }
};
