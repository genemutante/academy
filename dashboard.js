// dashboard.js

export function renderizarDashboard(canvasId = 'graficoResultado') {
  const canvas = document.getElementById(canvasId);

  if (!canvas) {
    console.warn(`❗ Canvas com ID '${canvasId}' não encontrado.`);
    return;
  }

  const ctx = canvas.getContext('2d');

  try {
    // Se já existe um gráfico, destrói corretamente
    if (window._graficoDashboard instanceof Chart) {
      window._graficoDashboard.destroy();
      console.log('🧹 Gráfico anterior destruído com sucesso.');
    }
  } catch (error) {
    console.warn('⚠️ Erro ao tentar destruir gráfico anterior:', error);
  }

  // Dados de exemplo (pode tornar dinâmico depois)
  const dados = {
    labels: ['Aula 1', 'Aula 2', 'Aula 3', 'Aula 4'],
    datasets: [
      {
        label: 'Percentual Concluído (%)',
        data: [75, 50, 98, 30],
        backgroundColor: '#3b82f6',
        borderRadius: 4
      }
    ]
  };

  const config = {
    type: 'bar',
    data: dados,
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value) => value + '%'
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.raw}% assistido`
          }
        }
      }
    }
  };

  // Criar nova instância e salvar globalmente
  window._graficoDashboard = new Chart(ctx, config);
  console.log('✅ Novo gráfico renderizado com sucesso!');
}
