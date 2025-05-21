
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/utils/currency';
import { PDF_CONFIG } from './config';
import { FinancialSummary } from './types';

/**
 * Adiciona resumo financeiro no PDF
 */
export const addFinancialSummary = (
  doc: jsPDF, 
  summary: FinancialSummary
) => {
  // Posiciona após a tabela de transações (ou após mensagem de nenhuma transação)
  const finalY = (doc as any).lastAutoTable?.finalY || (PDF_CONFIG.margin + 35);
  const { totalIncome, totalExpenses, balance } = summary;
  
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
