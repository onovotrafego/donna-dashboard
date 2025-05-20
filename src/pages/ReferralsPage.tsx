
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ComingSoon from '@/components/common/ComingSoon';

const ReferralsPage: React.FC = () => {
  return (
    <MainLayout title="Indique e Use de Graça">
      <ComingSoon 
        title="Sistema de indicações em breve" 
        message="Em breve você poderá indicar amigos e ganhar benefícios exclusivos."
      />
    </MainLayout>
  );
};

export default ReferralsPage;
