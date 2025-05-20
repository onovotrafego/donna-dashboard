
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
  change: number;
  period?: string;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ 
  balance, 
  change, 
  period = 'este mês' 
}) => {
  const isPositive = change >= 0;
  
  return (
    <div className="financial-card mb-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="statistic-label">Saldo atual</p>
          <h2 className="text-2xl font-bold font-poppins">
            {new Intl.NumberFormat('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            }).format(balance)}
          </h2>
        </div>
        
        <div className={`flex items-center p-2 rounded-full ${isPositive ? 'bg-finance-secondary/20 text-finance-secondary' : 'bg-finance-alert/20 text-finance-alert'}`}>
          {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
        </div>
      </div>
      
      <div className="flex items-center mt-2">
        <span className={isPositive ? 'text-finance-secondary' : 'text-finance-alert'}>
          {isPositive ? '+' : ''}{change}%
        </span>
        <span className="text-xs text-muted-foreground ml-2">
          {period}
        </span>
      </div>
    </div>
  );
};

export default BalanceCard;
