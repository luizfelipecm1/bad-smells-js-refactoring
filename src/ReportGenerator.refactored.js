// src/ReportGenerator.refactored.js

/**
 * Motivação da Refatoração:
 * 1. (Método Longo): O método original 'generateReport' era monolítico, fazendo
 * filtragem, processamento e formatação de dois tipos (CSV e HTML) num só lugar.
 * 2. (Duplicação de Lógica): A lógica de cálculo de 'total' e a lógica de
 * iteração pelos itens estavam duplicadas entre os blocos 'if (reportType === ...)'
 * e 'if (user.role === ...)'.
 * 3. (Alta Complexidade Cognitiva): A quantidade de ninhos de 'if/else' e 'for'
 * tornava o código difícil de entender e manter (violando a regra do sonarjs).
 * 4. (Números Mágicos): Valores como '500' e '1000' estavam soltos no código.
 *
 * Estratégia Aplicada (Técnicas):
 * 1. (Extract Method): A lógica de geração de CSV e HTML foi extraída para
 * métodos privados (_generateCsvReport, _generateHtmlReport).
 * 2. (Extract Method / Decompose Conditional): A lógica de filtragem e processamento
 * dos itens (baseada na role do usuário) foi extraída para _getProcessedItems.
 * Isso separa o "o quê" (quais itens) do "como" (qual formato).
 * 3. (Replace Magic Number with Constant): Os números 500 e 1000 foram
 * movidos para constantes estáticas.
 */

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  // (Refatoração) Remove Magic Numbers
  static USER_VALUE_LIMIT = 500;
  static ADMIN_PRIORITY_LIMIT = 1000;

  /**
   * Gera um relatório de itens (Refatorado).
   * O método principal agora delega as responsabilidades:
   * 1. Processa os dados (filtra e aplica regras de negócio).
   * 2. Calcula o total.
   * 3. Delega a formatação para métodos especializados.
   */
  generateReport(reportType, user, items) {
    // 1. (Extract Method) Obter os dados relevantes primeiro.
    const processedItems = this._getProcessedItems(user, items);

    // 2. (Single Responsibility) Calcular o total (lógica movida do loop).
    const total = processedItems.reduce((sum, item) => sum + item.value, 0);

    // 3. (Strategy/Factory simples) Delegar a geração do formato.
    if (reportType === 'CSV') {
      return this._generateCsvReport(user, processedItems, total);
    } else if (reportType === 'HTML') {
      return this._generateHtmlReport(user, processedItems, total);
    }
    return '';
  }

  /**
   * (Extract Method)
   * Filtra e processa a lista de itens com base na role do usuário.
   * Aplica a lógica de prioridade do Admin.
   */
  _getProcessedItems(user, items) {
    if (user.role === 'ADMIN') {
      // Admin vê tudo. Mapeamos para adicionar 'priority' se necessário.
      return items.map((item) => ({
        ...item,
        // Adiciona a flag de prioridade que será usada pelo formatador HTML
        priority: item.value > ReportGenerator.ADMIN_PRIORITY_LIMIT,
      }));
    }

    if (user.role === 'USER') {
      // User vê apenas itens filtrados.
      return items.filter(
        (item) => item.value <= ReportGenerator.USER_VALUE_LIMIT,
      );
    }

    // Retorna vazio se a role não for reconhecida
    return [];
  }

  /**
   * (Extract Method)
   * Gera o relatório especificamente no formato CSV.
   * (Complexidade reduzida, sem duplicação de lógica de total).
   */
  _generateCsvReport(user, items, total) {
    // Seção do Cabeçalho
    let report = 'ID,NOME,VALOR,USUARIO\n';

    // Seção do Corpo (Agora muito mais simples)
    for (const item of items) {
      // O teste original (ReportGenerator.test.js) espera o nome do usuário
      // em cada linha do CSV.
      report += `${item.id},${item.name},${item.value},${user.name}\n`;
    }

    // Seção do Rodapé
    report += '\nTotal,,\n';
    report += `${total},,\n`;
    return report.trim();
  }

  /**
   * (Extract Method)
   * Gera o relatório especificamente no formato HTML.
   * (Complexidade reduzida, sem duplicação de lógica de total).
   */
  _generateHtmlReport(user, items, total) {
    // Seção do Cabeçalho
    let report = '<html><body>\n';
    report += '<h1>Relatório</h1>\n';
    // O teste original (ReportGenerator.test.js) espera o nome do usuário
    // no cabeçalho do HTML.
    report += `<h2>Usuário: ${user.name}</h2>\n`;
    report += '<table>\n';
    report += '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n';

    // Seção do Corpo (Agora muito mais simples)
    for (const item of items) {
      // A lógica de prioridade foi resolvida em _getProcessedItems.
      const style = item.priority ? 'style="font-weight:bold;"' : '';
      report += `<tr ${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
    }

    // Seção do Rodapé
    report += '</table>\n';
    report += `<h3>Total: ${total}</h3>\n`;
    report += '</body></html>\n';
    return report.trim();
  }
}