
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ComingSoon from '@/components/common/ComingSoon';

const CommitmentsPage: React.FC = () => {
  return (
    <MainLayout title="Meus Compromissos">
      <ComingSoon 
        title="Compromissos em breve" 
        message="Em breve você poderá visualizar e gerenciar todos os seus compromissos financeiros nesta página."
      />
    </MainLayout>
  );
};

export default CommitmentsPage;
