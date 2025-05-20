
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NotFound: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="financial-card text-center max-w-sm w-full">
        <h1 className="text-3xl font-bold mb-4">404</h1>
        <p className="text-muted-foreground mb-6">
          A página <span className="text-primary font-medium">{location.pathname}</span> não foi encontrada.
        </p>
        <Link 
          to="/" 
          className="inline-block bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Voltar para o início
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
