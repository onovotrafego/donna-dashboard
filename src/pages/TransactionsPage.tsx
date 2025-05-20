
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import TransactionList from '@/components/dashboard/TransactionList';

const TransactionsPage: React.FC = () => {
  return (
    <MainLayout title="Minhas Transações">
      <div className="max-w-md mx-auto">
        <TransactionList showViewAll={false} />
      </div>
    </MainLayout>
  );
};

export default TransactionsPage;
