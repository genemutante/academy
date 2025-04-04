import { log } from './logger.js';

let markdownFinal = '';
let relatorioHTML = '';

export function iniciarRelatorio(titulo, descricaoTecnica, descricaoLeiga) {
  const dataHora = new Date().toLocaleString();

  markdownFinal = `# Relatório de Validação - ${titulo}\n\n`;
  markdownFinal += `🕒 Gerado em: ${dataHora}\n\n`;
  markdownFinal += `## Descrição Técnica\n${descricaoTecnica}\n\n`;
  markdownFinal += `## Descrição Humana\n${descricaoLeiga}\n\n`;
  markdownFinal += `## Detalhamento das Etapas\n`;

  relatorioHTML = `
    <h2 class="text-lg font-semibold mb-2">${titulo}</h2>
    <p class="text-sm text-gray-500 mb-4">🕒 Gerado em: ${dataHora}</p>
    <hr class="my-2" />
    <h3 class="text-md font-medium mt-4">Descrição Técnica</h3>
    <p class="mb-4">${descricaoTecnica}</p>
    <h3 class="text-md font-medium mt-4">Descrição Humana</h3>
    <p class="mb-4">${descricaoLeiga}</p>
    <hr class="my-2" />
    <h3 class="text-md font-medium mt-4">Etapas</h3>
    <ul class="list-disc ml-6 mt-2">
  `;
}

export function registrarEtapa(etapaMarkdown, etapaHTML) {
  markdownFinal += `- ${etapaMarkdown}\n`;
  relatorioHTML += `<li class="mb-1">${etapaHTML}</li>`;
}

export function finalizarRelatorio(resultadoFinal) {
  markdownFinal += `\n## Diagnóstico Final\n${resultadoFinal}\n`;
  relatorioHTML += `
    </ul>
    <hr class="my-4" />
    <h3 class="text-md font-medium mt-4">Diagnóstico Final</h3>
    <p class="mb-4">${resultadoFinal}</p>
  `;

  const container = document.getElementById('relatorioExecucao');
  if (!container) {
    console.warn('⚠️ Elemento #relatorioExecucao não encontrado. Relatório não renderizado.');
    return;
  }

  container.innerHTML = relatorioHTML;
  log('📄 Relatório gerado com sucesso!');
}

export function exportarComoMarkdown() {
  const blob = new Blob([markdownFinal], { type: 'text/markdown;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'relatorio_validacao.md';
  link.click();
}

export function exportarComoPDF() {
  import('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.3/html2pdf.bundle.min.js').then(() => {
    const element = document.getElementById('relatorioExecucao');
    if (!element) {
      alert('⚠️ Elemento do relatório não encontrado para exportação.');
      return;
    }
    html2pdf().from(element).save('relatorio_validacao.pdf');
  });
}
