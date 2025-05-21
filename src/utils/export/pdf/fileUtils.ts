
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Gera o nome do arquivo com o período
 */
export const generateFileName = (dateRange: { from: Date; to: Date }): string => {
  const fromDate = format(dateRange.from, 'dd-MM-yyyy', { locale: ptBR });
  const toDate = format(dateRange.to, 'dd-MM-yyyy', { locale: ptBR });
  
  return `relatorio-transacoes_${fromDate}_a_${toDate}.pdf`;
};
