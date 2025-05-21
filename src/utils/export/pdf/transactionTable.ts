
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Transaction } from '@/components/dashboard/TransactionList';
import { formatCurrency } from '@/utils/currency';
import { PDF_CONFIG } from './config';

/**
 * Adiciona tabela de transações no PDF
 */
export const addTransactionTable = (doc: jsPDF, transactions: Transaction[]) => {
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
