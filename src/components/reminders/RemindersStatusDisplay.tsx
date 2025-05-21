
import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface RemindersStatusDisplayProps {
  isLoading: boolean;
  error: Error | null;
  isEmpty: boolean;
  onRefresh: () => void;
}

const RemindersStatusDisplay: React.FC<RemindersStatusDisplayProps> = ({
  isLoading,
  error,
  isEmpty,
  onRefresh
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Carregando compromissos...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-medium mb-2 text-destructive">Erro ao carregar compromissos</h3>
        <p className="text-muted-foreground">
          Ocorreu um erro ao buscar seus compromissos. Por favor, tente novamente mais tarde.
        </p>
        <button 
          onClick={onRefresh}
          className="mt-4 flex items-center justify-center mx-auto bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
        </button>
      </Card>
    );
  }
  
  if (isEmpty) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-medium mb-2">Nenhum compromisso encontrado</h3>
        <p className="text-muted-foreground">
          Você ainda não possui nenhum compromisso financeiro registrado.
        </p>
        <button 
          onClick={onRefresh}
          className="mt-4 flex items-center justify-center mx-auto bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Verificar novamente
        </button>
      </Card>
    );
  }
  
  return null;
};

export default RemindersStatusDisplay;
