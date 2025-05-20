
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import BalanceCard from '@/components/dashboard/BalanceCard';
import StatisticsRow from '@/components/dashboard/StatisticsRow';
import TransactionList from '@/components/dashboard/TransactionList';

const Index: React.FC = () => {
  return (
    <MainLayout title="Minhas Finanças">
      <div className="max-w-md mx-auto">
        <BalanceCard balance={6450.75} change={12.5} />
        <StatisticsRow />
        <TransactionList limit={5} />
      </div>
    </MainLayout>
  );
};

export default Index;
