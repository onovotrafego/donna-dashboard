
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateTransactionReport } from '@/utils/export/pdf'; // Updated import path
import type { Transaction } from '@/components/dashboard/TransactionList';

interface ExportButtonProps {
  transactions: Transaction[];
  dateRange: { from: Date; to: Date };
  userName?: string;
  disabled?: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({ 
  transactions, 
  dateRange, 
  userName,
  disabled = false
}) => {
  const { toast } = useToast();
  
  const handleExport = () => {
    try {
      if (transactions.length === 0) {
        toast({
          title: "Sem dados para exportar",
          description: "Não há transações no período selecionado para gerar o relatório.",
          variant: "destructive"
        });
        return;
      }
      
      generateTransactionReport(transactions, dateRange, userName);
      
      toast({
        title: "Relatório gerado com sucesso",
        description: "O download do seu relatório em PDF foi iniciado.",
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao gerar o relatório. Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Button
      onClick={handleExport}
      disabled={disabled}
      variant="outline"
      size="sm"
      className="flex items-center gap-1"
    >
      <Download size={16} />
      Exportar PDF
    </Button>
  );
};

export default ExportButton;
