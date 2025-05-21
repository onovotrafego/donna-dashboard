
// This file is kept for backward compatibility
// but delegates all functionality to the new modular structure
import { generateTransactionReport as generateReport } from './pdf';
import type { Transaction } from '@/components/dashboard/TransactionList';

/**
 * Gera um PDF com relatório das transações
 */
export const generateTransactionReport = (
  transactions: Transaction[], 
  dateRange: { from: Date; to: Date },
  userName?: string
) => {
  return generateReport(transactions, dateRange, userName);
};
