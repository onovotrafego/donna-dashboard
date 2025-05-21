
import jsPDF from 'jspdf';
import type { Transaction } from '@/components/dashboard/TransactionList';
import { PDFReportParams, FinancialSummary } from './types';
import { addReportHeader, addReportFooter } from './headerFooter';
import { addTransactionTable } from './transactionTable';
import { addFinancialSummary } from './financialSummary';
import { generateFileName } from './fileUtils';

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
  const summary: FinancialSummary = {
    totalIncome: transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    
    totalExpenses: transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
    
    balance: 0 // Will be calculated below
  };
  
  // Calculate balance
  summary.balance = summary.totalIncome - summary.totalExpenses;
  
  // Adiciona o cabeçalho do relatório
  addReportHeader(doc, dateRange, userName);
  
  // Adiciona tabela de transações
  addTransactionTable(doc, transactions);
  
  // Adiciona resumo financeiro
  addFinancialSummary(doc, summary);
  
  // Adiciona rodapé
  addReportFooter(doc);
  
  // Gera o nome do arquivo com o período
  const fileName = generateFileName(dateRange);
  
  // Retorna o PDF para download
  doc.save(fileName);
};
