
import React from 'react';
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';

interface StatisticProps {
  label: string;
  value: number;
  type: 'income' | 'expense' | 'savings';
}

const Statistic: React.FC<StatisticProps> = ({ label, value, type }) => {
  const icons = {
    income: <ArrowUpCircle className="text-finance-secondary" size={20} />,
    expense: <ArrowDownCircle className="text-finance-alert" size={20} />,
    savings: <Wallet className="text-finance-primary" size={20} />
  };
  
  return (
    <div className="financial-card flex-1">
      <div className="flex items-center gap-2 mb-1">
        {icons[type]}
        <p className="statistic-label">{label}</p>
      </div>
      <p className="statistic-value">
        {new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL',
          maximumFractionDigits: 0
        }).format(value)}
      </p>
    </div>
  );
};

const StatisticsRow: React.FC = () => {
  // Sample data (will be replaced with real data)
  const statistics = [
    { label: 'Entradas', value: 5250, type: 'income' as const },
    { label: 'Saídas', value: 3840, type: 'expense' as const },
    { label: 'Economia', value: 1410, type: 'savings' as const }
  ];
  
  return (
    <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
      {statistics.map((stat, index) => (
        <Statistic 
          key={index} 
          label={stat.label} 
          value={stat.value} 
          type={stat.type} 
        />
      ))}
    </div>
  );
};

export default StatisticsRow;
