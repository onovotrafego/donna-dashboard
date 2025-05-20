
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface EmailFormProps {
  email: string;
  setEmail: (value: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  error?: string;
}

const EmailForm: React.FC<EmailFormProps> = ({
  email,
  setEmail,
  loading,
  onSubmit,
  error
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="Digite seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      {error && (
        <div className="text-sm text-red-500 font-medium">
          {error}
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full bg-finance-primary hover:bg-finance-primary/90" 
        disabled={loading}
      >
        {loading ? "Verificando..." : "Continuar"}
      </Button>
    </form>
  );
};

export default EmailForm;
