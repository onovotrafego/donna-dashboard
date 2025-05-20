
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  password: string;
  setPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onBack: () => void;
  error?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
  password,
  setPassword,
  showPassword,
  setShowPassword,
  loading,
  onSubmit,
  onBack,
  error
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-muted-foreground">
          Digite sua senha para acessar o dashboard
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button 
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
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
        {loading ? "Processando..." : "Entrar"}
      </Button>
      
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onBack}
      >
        Voltar
      </Button>
    </form>
  );
};

export default LoginForm;
