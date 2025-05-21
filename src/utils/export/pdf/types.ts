
import type { Transaction } from '@/components/dashboard/TransactionList';

export interface PDFConfig {
  margin: number;
  titleFontSize: number;
  subtitleFontSize: number;
  textFontSize: number;
  footerFontSize: number;
}

export interface PDFReportParams {
  transactions: Transaction[];
  dateRange: { from: Date; to: Date };
  userName?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}
