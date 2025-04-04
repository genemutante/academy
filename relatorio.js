// relatorio.js

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
  relatorioHTML = `<h2>${titulo}</h2><p><em>${dataHora}</em></p><hr><h3>Descrição Técnica</h3><p>${descricaoTecnica}</p><h3>Descrição Humana</h3><p>${descricaoLeiga}</p><hr><h3>Etapas</h3><ul>`;
}

export function registrarEtapa(etapaMarkdown, etapaHTML) {
  markdownFinal += `- ${etapaMarkdown}\n`;
  relatorioHTML += `<li>${etapaHTML}</li>`;
}

export function finalizarRelatorio(resultadoFinal) {
  markdownFinal += `\n## Diagnóstico Final\n${resultadoFinal}\n`;
  relatorioHTML += `</ul><hr><h3>Diagnóstico Final</h3><p>${resultadoFinal}</p>`;
  document.getElementById('relatorio').innerHTML = relatorioHTML;
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
    const element = document.getElementById('relatorio');
    html2pdf().from(element).save('relatorio_validacao.pdf');
  });
}
