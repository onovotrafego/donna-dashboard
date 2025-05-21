
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PDF_CONFIG } from './config';

/**
 * Adiciona o cabeçalho do relatório no PDF
 */
export const addReportHeader = (
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
 * Adiciona rodapé ao relatório
 */
export const addReportFooter = (doc: jsPDF) => {
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
