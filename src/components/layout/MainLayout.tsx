
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
      <style jsx global>{`
        .mobile-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-top: 1px solid #eaeaea;
          padding: 8px 0;
        }
        
        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px 0;
          color: #666;
          text-decoration: none;
          font-size: 12px;
        }
        
        .nav-item.active {
          color: #0070f3;
        }
        
        .nav-item-text {
          margin-top: 4px;
          font-size: 11px;
        }
      `}</style>
      <MobileNavigation />
    </div>
  );
};

export default MainLayout;
