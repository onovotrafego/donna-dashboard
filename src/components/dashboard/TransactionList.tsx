
import React, { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { parseBrazilianCurrency, formatCurrency } from '@/utils/currency';

export interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
}

interface TransactionListProps {
  limit?: number;
  showViewAll?: boolean;
  isLoading?: boolean;
  transactions?: Transaction[];
  error?: string;
}

const TransactionList: React.FC<TransactionListProps> = ({ 
  limit, 
  showViewAll = true,
  isLoading = false,
  transactions = [],
  error
}) => {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  
  // Use provided transactions or fallback to sample data
  const displayTransactions = transactions.length > 0 
    ? transactions 
    : [];
  
  const filteredTransactions = displayTransactions
    .filter(transaction => filter === 'all' || transaction.type === filter)
    .slice(0, limit);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };
  
  if (isLoading) {
    return (
      <div className="financial-card animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="mb-3">
            <div className="h-16 bg-muted/30 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="financial-card">
        <h3 className="text-lg font-semibold mb-4">Transações</h3>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <p className="font-medium">Erro ao carregar transações</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }
  
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
                {formatCurrency(transaction.amount)}
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
          <Button variant="outline" className="w-full" asChild>
            <Link to="/transactions">Ver todas as transações</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
