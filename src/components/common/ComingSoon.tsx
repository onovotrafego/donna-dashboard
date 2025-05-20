
import React from 'react';
import { Sparkles } from 'lucide-react';

interface ComingSoonProps {
  title?: string;
  message?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ 
  title = "Em breve", 
  message = "Estamos trabalhando para disponibilizar esta funcionalidade em breve. Aguarde!" 
}) => {
  return (
    <div className="coming-soon animate-fade-in">
      <div className="mb-4 text-primary">
        <Sparkles size={48} className="animate-pulse-slow" />
      </div>
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
};

export default ComingSoon;
