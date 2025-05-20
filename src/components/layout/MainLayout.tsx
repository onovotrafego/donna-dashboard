
import React from 'react';
import MobileNavigation from './MobileNavigation';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  title 
}) => {
  return (
    <div className="min-h-screen pt-4 pb-20">
      {title && (
        <header className="px-4 mb-4">
          <h1 className="text-2xl font-bold font-poppins">{title}</h1>
        </header>
      )}
      <main className="px-4">
        {children}
      </main>
      <MobileNavigation />
    </div>
  );
};

export default MainLayout;
