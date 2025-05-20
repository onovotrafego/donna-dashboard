
import React, { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
}

// Sample transactions data (would be fetched from API)
const sampleTransactions: Transaction[] = [
  {
    id: '1',
    title: 'Salário',
    category: 'Renda',
    amount: 3500,
    date: '2025-05-05',
    type: 'income'
  },
  {
    id: '2',
    title: 'Supermercado',
    category: 'Alimentação',
    amount: 350.75,
    date: '2025-05-10',
    type: 'expense'
  },
  {
    id: '3',
    title: 'Aluguel',
    category: 'Moradia',
    amount: 1200,
    date: '2025-05-15',
    type: 'expense'
  },
  {
    id: '4',
    title: 'Freelance',
    category: 'Renda Extra',
    amount: 750,
    date: '2025-05-20',
    type: 'income'
  },
  {
    id: '5',
    title: 'Restaurante',
    category: 'Alimentação',
    amount: 120.50,
    date: '2025-05-18',
    type: 'expense'
  }
];

interface TransactionListProps {
  limit?: number;
  showViewAll?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({ 
  limit, 
  showViewAll = true 
}) => {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  
  const filteredTransactions = sampleTransactions
    .filter(transaction => filter === 'all' || transaction.type === filter)
    .slice(0, limit);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };
  
  return (
    <div className="financial-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Transações</h3>
        
        <div className="flex bg-muted rounded-lg p-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`px-2 py-1 rounded-md ${filter === 'all' ? 'bg-accent text-white' : 'text-muted-foreground'}`}
            onClick={() => setFilter('all')}
          >
            Todos
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`px-2 py-1 rounded-md ${filter === 'income' ? 'bg-finance-secondary text-white' : 'text-muted-foreground'}`}
            onClick={() => setFilter('income')}
          >
            <ArrowUpCircle size={14} className="mr-1" /> Entradas
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`px-2 py-1 rounded-md ${filter === 'expense' ? 'bg-finance-alert text-white' : 'text-muted-foreground'}`}
            onClick={() => setFilter('expense')}
          >
            <ArrowDownCircle size={14} className="mr-1" /> Saídas
          </Button>
        </div>
      </div>
      
      <div className="space-y-3">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map(transaction => (
            <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center">
                <div className={`p-2 rounded-full mr-3 ${transaction.type === 'income' ? 'bg-finance-secondary/20 text-finance-secondary' : 'bg-finance-alert/20 text-finance-alert'}`}>
                  {transaction.type === 'income' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                </div>
                <div>
                  <p className="font-medium">{transaction.title}</p>
                  <p className="text-xs text-muted-foreground">{transaction.category} • {formatDate(transaction.date)}</p>
                </div>
              </div>
              
              <p className={`font-medium ${transaction.type === 'income' ? 'text-finance-secondary' : 'text-finance-alert'}`}>
                {transaction.type === 'income' ? '+' : '-'}
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(transaction.amount)}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            Nenhuma transação encontrada
          </div>
        )}
      </div>
      
      {showViewAll && (
        <div className="mt-4 text-center">
          <Button variant="outline" className="w-full">
            Ver todas as transações
          </Button>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
