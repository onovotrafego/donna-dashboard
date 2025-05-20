
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [remotejid, setRemotejid] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'checkUser' | 'createPassword' | 'enterPassword'>('checkUser');
  const [showPassword, setShowPassword] = useState(false);
  const [clienteData, setClienteData] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkUserExists = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!remotejid) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, digite seu ID de usuário",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if user exists with this remotejid
      const { data, error } = await supabase
        .from('donna_clientes')
        .select('*')
        .eq('remotejid', remotejid)
        .single();
      
      if (error) {
        toast({
          title: "Erro ao verificar usuário",
          description: "Usuário não encontrado. Verifique seu ID e tente novamente.",
          variant: "destructive"
        });
        return;
      }
      
      setClienteData(data);
      
      // Determine next step based on whether user has password
      if (!data.password_hash) {
        setStep('createPassword');
      } else {
        setStep('enterPassword');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro no sistema",
        description: "Ocorreu um erro durante a verificação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Por favor, confirme que as senhas são iguais",
        variant: "destructive"
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "Sua senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Update user with new password
      const { error: updateError } = await supabase
        .from('donna_clientes')
        .update({ 
          password_hash: password, 
          completou_cadastro: true 
        })
        .eq('id', clienteData.id);
      
      if (updateError) {
        toast({
          title: "Erro ao definir senha",
          description: "Não foi possível definir sua senha. Tente novamente.",
          variant: "destructive"
        });
        return;
      }
      
      // Set auth session
      sessionStorage.setItem('user_id', clienteData.id);
      sessionStorage.setItem('user_name', clienteData.nome || 'Usuário');
      
      toast({
        title: "Senha criada com sucesso!",
        description: "Bem-vindo ao seu dashboard financeiro."
      });
      
      navigate('/');
    } catch (error) {
      console.error('Create password error:', error);
      toast({
        title: "Erro no sistema",
        description: "Ocorreu um erro ao criar sua senha. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Verify password
      if (clienteData.password_hash !== password) {
        toast({
          title: "Senha incorreta",
          description: "Por favor, verifique sua senha e tente novamente.",
          variant: "destructive"
        });
        return;
      }
      
      // Set auth session
      sessionStorage.setItem('user_id', clienteData.id);
      sessionStorage.setItem('user_name', clienteData.nome || 'Usuário');
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao seu dashboard financeiro."
      });
      
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro no sistema",
        description: "Ocorreu um erro durante o login. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const renderCheckUserStep = () => (
    <form onSubmit={checkUserExists} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="remotejid">ID de Usuário</Label>
        <Input
          id="remotejid"
          placeholder="Digite seu ID de usuário"
          value={remotejid}
          onChange={(e) => setRemotejid(e.target.value)}
          required
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-finance-primary hover:bg-finance-primary/90" 
        disabled={loading}
      >
        {loading ? "Verificando..." : "Continuar"}
      </Button>
    </form>
  );

  const renderCreatePasswordStep = () => (
    <form onSubmit={handleCreatePassword} className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-muted-foreground">
          Primeira vez? Crie uma senha para acessar seu dashboard
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Nova Senha</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Crie sua senha"
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
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirme sua Senha</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Confirme sua senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-finance-primary hover:bg-finance-primary/90" 
        disabled={loading}
      >
        {loading ? "Processando..." : "Criar Senha"}
      </Button>
      
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setStep('checkUser')}
      >
        Voltar
      </Button>
    </form>
  );

  const renderEnterPasswordStep = () => (
    <form onSubmit={handleLogin} className="space-y-4">
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
        onClick={() => setStep('checkUser')}
      >
        Voltar
      </Button>
    </form>
  );
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1A365D] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-background/95 backdrop-blur-sm p-8 rounded-lg shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold font-poppins mb-2">Assistente Financeiro</h1>
        </div>
        
        {step === 'checkUser' && renderCheckUserStep()}
        {step === 'createPassword' && renderCreatePasswordStep()}
        {step === 'enterPassword' && renderEnterPasswordStep()}
      </div>
    </div>
  );
};

export default AuthPage;
