
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ComingSoon from '@/components/common/ComingSoon';

const SettingsPage: React.FC = () => {
  return (
    <MainLayout title="Ajustes">
      <ComingSoon 
        title="Ajustes em breve" 
        message="Em breve você poderá personalizar sua experiência e gerenciar suas configurações."
      />
    </MainLayout>
  );
};

export default SettingsPage;
