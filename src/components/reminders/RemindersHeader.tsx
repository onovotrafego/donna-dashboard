
import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

interface RemindersHeaderProps {
  isRefetching: boolean;
  onRefresh: () => void;
  dataUpdatedAt: number;
  remindersCount: number;
}

const RemindersHeader: React.FC<RemindersHeaderProps> = ({
  isRefetching,
  onRefresh,
  dataUpdatedAt,
  remindersCount
}) => {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Meus Compromissos</h2>
        <button 
          onClick={onRefresh}
          className="flex items-center text-sm bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/80"
          aria-label="Atualizar dados"
        >
          {isRefetching ? (
            <>
              <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Atualizando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-1 h-4 w-4" /> Atualizar
            </>
          )}
        </button>
      </div>
      
      {remindersCount > 0 && (
        <div className="mb-4 text-sm text-muted-foreground">
          Mostrando {remindersCount} compromissos • 
          Última atualização: {new Date(dataUpdatedAt).toLocaleTimeString()}
        </div>
      )}
    </>
  );
};

export default RemindersHeader;
