
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Transaction } from '@/components/dashboard/TransactionList';
import { formatCurrency } from '@/utils/currency';

// Configurações do relatório
const PDF_CONFIG = {
  margin: 15,
  titleFontSize: 16,
  subtitleFontSize: 12,
  textFontSize: 10,
  footerFontSize: 8
};

/**
 * Gera um PDF com relatório das transações
 */
export const generateTransactionReport = (
  transactions: Transaction[], 
  dateRange: { from: Date; to: Date },
  userName?: string
) => {
  // Inicializa o documento PDF (A4, orientação retrato)
  const doc = new jsPDF();
  
  // Calcula totais
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpenses;
  
  // Adiciona o cabeçalho do relatório
  addReportHeader(doc, dateRange, userName);
  
  // Adiciona tabela de transações
  addTransactionTable(doc, transactions);
  
  // Adiciona resumo financeiro
  addFinancialSummary(doc, totalIncome, totalExpenses, balance);
  
  // Adiciona rodapé
  addReportFooter(doc);
  
  // Gera o nome do arquivo com o período
  const fileName = generateFileName(dateRange);
  
  // Retorna o PDF para download
  doc.save(fileName);
};

/**
 * Adiciona o cabeçalho do relatório no PDF
 */
const addReportHeader = (
  doc: jsPDF, 
  dateRange: { from: Date; to: Date },
  userName?: string
) => {
  // Título principal
  doc.setFontSize(PDF_CONFIG.titleFontSize);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Transações', doc.internal.pageSize.getWidth() / 2, PDF_CONFIG.margin, { align: 'center' });
  
  // Informações do usuário
  doc.setFontSize(PDF_CONFIG.subtitleFontSize);
  doc.setFont('helvetica', 'normal');
  const userText = userName 
    ? `Usuário: ${userName}` 
    : 'Relatório de Transações';
  doc.text(userText, doc.internal.pageSize.getWidth() / 2, PDF_CONFIG.margin + 10, { align: 'center' });
  
  // Período do relatório
  const periodText = `Período: ${format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} a ${format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}`;
  doc.text(periodText, doc.internal.pageSize.getWidth() / 2, PDF_CONFIG.margin + 16, { align: 'center' });
  
  // Data e hora de geração
  const generationText = `Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`;
  doc.setFontSize(PDF_CONFIG.textFontSize);
  doc.text(generationText, doc.internal.pageSize.getWidth() - PDF_CONFIG.margin, PDF_CONFIG.margin, { align: 'right' });
  
  // Adiciona espaço após o cabeçalho
  doc.setLineWidth(0.5);
  doc.line(PDF_CONFIG.margin, PDF_CONFIG.margin + 20, doc.internal.pageSize.getWidth() - PDF_CONFIG.margin, PDF_CONFIG.margin + 20);
};

/**
 * Adiciona tabela de transações no PDF
 */
const addTransactionTable = (doc: jsPDF, transactions: Transaction[]) => {
  if (transactions.length === 0) {
    doc.setFontSize(PDF_CONFIG.textFontSize);
    doc.text('Nenhuma transação encontrada no período selecionado.', PDF_CONFIG.margin, PDF_CONFIG.margin + 30);
    return;
  }
  
  // Configura as colunas da tabela
  const tableColumn = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor (R$)'];
  
  // Prepara os dados para a tabela
  const tableRows = transactions.map(transaction => {
    const formattedDate = format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR });
    const transactionType = transaction.type === 'income' ? 'Entrada' : 'Saída';
    
    // Formata o valor com sinal + ou -
    const valueSign = transaction.type === 'income' ? '+' : '-';
    const formattedValue = formatCurrency(transaction.amount).replace('R$', '').trim();
    
    return [
      formattedDate,
      transaction.title,
      transaction.category,
      transactionType,
      `${valueSign} ${formattedValue}`
    ];
  });
  
  // Conteúdo da tabela
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: PDF_CONFIG.margin + 25,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 25 }, // Data
      1: { cellWidth: 'auto' }, // Descrição
      2: { cellWidth: 30 }, // Categoria
      3: { cellWidth: 20 }, // Tipo
      4: { cellWidth: 25, halign: 'right' } // Valor
    },
    didParseCell: function(data) {
      // Aplica cor verde para entradas e vermelha para saídas na coluna de valor
      const col = data.column.index;
      const row = data.row.index;
      const section = data.section;
      
      // Só aplica estilo às células do corpo (não ao cabeçalho)
      if (section === 'body' && col === 4) {
        // Verifica se o valor começa com '+' (entrada) ou '-' (saída)
        const cellValue = data.cell.text[0];
        if (cellValue.startsWith('+ ')) {
          data.cell.styles.textColor = [34, 139, 34]; // Verde para entradas
        } else if (cellValue.startsWith('- ')) {
          data.cell.styles.textColor = [220, 53, 69]; // Vermelho para saídas
        }
      }
    }
  });
};

/**
 * Adiciona resumo financeiro no PDF
 */
const addFinancialSummary = (
  doc: jsPDF, 
  totalIncome: number, 
  totalExpenses: number, 
  balance: number
) => {
  // Posiciona após a tabela de transações (ou após mensagem de nenhuma transação)
  const finalY = (doc as any).lastAutoTable?.finalY || (PDF_CONFIG.margin + 35);
  
  doc.setFontSize(PDF_CONFIG.subtitleFontSize);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo Financeiro', PDF_CONFIG.margin, finalY + 15);
  
  // Tabela de resumo
  const summaryData = [
    ['Total de Entradas', formatCurrency(totalIncome)],
    ['Total de Saídas', formatCurrency(totalExpenses)],
    ['Saldo do Período', formatCurrency(balance)]
  ];
  
  autoTable(doc, {
    body: summaryData,
    startY: finalY + 20,
    theme: 'plain',
    styles: {
      fontSize: 10
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 100 },
      1: { halign: 'right', cellWidth: 80 }
    },
    didParseCell: function(data) {
      const row = data.row.index;
      const col = data.column.index;
      
      // Aplica cor ao saldo (verde se positivo, vermelho se negativo)
      if (row === 2 && col === 1) {
        data.cell.styles.textColor = balance >= 0 ? [34, 139, 34] : [220, 53, 69];
        data.cell.styles.fontStyle = 'bold';
      }
      
      // Aplica cor às entradas (verde) e saídas (vermelho)
      if (col === 1) {
        if (row === 0) data.cell.styles.textColor = [34, 139, 34];
        if (row === 1) data.cell.styles.textColor = [220, 53, 69];
      }
    }
  });
};

/**
 * Adiciona rodapé ao relatório
 */
const addReportFooter = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  
  // Adiciona numeração de página em todas as páginas
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(PDF_CONFIG.footerFontSize);
    doc.setFont('helvetica', 'normal');
    
    const pageText = `Página ${i} de ${pageCount}`;
    doc.text(pageText, doc.internal.pageSize.getWidth() - PDF_CONFIG.margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    
    // Aviso/disclaimer
    const currentDate = format(new Date(), 'dd/MM/yyyy', { locale: ptBR });
    const footerText = `Relatório gerado em ${currentDate}. Este documento serve apenas como referência financeira.`;
    doc.text(footerText, PDF_CONFIG.margin, doc.internal.pageSize.getHeight() - 10, { align: 'left' });
  }
};

/**
 * Gera o nome do arquivo com o período do relatório
 */
const generateFileName = (dateRange: { from: Date; to: Date }): string => {
  const fromDate = format(dateRange.from, 'dd-MM-yyyy', { locale: ptBR });
  const toDate = format(dateRange.to, 'dd-MM-yyyy', { locale: ptBR });
  
  return `relatorio-transacoes_${fromDate}_a_${toDate}.pdf`;
};
