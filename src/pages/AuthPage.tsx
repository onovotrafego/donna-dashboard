
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const AuthPage: React.FC = () => {
  const [remotejid, setRemotejid] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isFirstLogin && password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Por favor, confirme que as senhas são iguais",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if user exists with this remotejid
      const { data: clienteData, error: clienteError } = await supabase
        .from('donna_clientes')
        .select('*')
        .eq('remotejid', remotejid)
        .single();
      
      if (clienteError) {
        toast({
          title: "Erro ao fazer login",
          description: "Usuário não encontrado. Verifique seu ID e tente novamente.",
          variant: "destructive"
        });
        return;
      }
      
      // If first login (no password set yet)
      if (!clienteData.password_hash) {
        if (!isFirstLogin) {
          setIsFirstLogin(true);
          setLoading(false);
          return;
        }
        
        // Update user with new password
        const { error: updateError } = await supabase
          .from('donna_clientes')
          .update({ password_hash: password, completou_cadastro: true })
          .eq('id', clienteData.id);
        
        if (updateError) {
          toast({
            title: "Erro ao definir senha",
            description: "Não foi possível definir sua senha. Tente novamente.",
            variant: "destructive"
          });
          return;
        }
      } 
      else if (clienteData.password_hash !== password) {
        toast({
          title: "Senha incorreta",
          description: "Por favor, verifique sua senha e tente novamente.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      // Set auth session - using a custom token approach since we're not using built-in auth
      sessionStorage.setItem('user_id', clienteData.id);
      sessionStorage.setItem('user_name', clienteData.nome || 'Usuário');
      
      toast({
        title: isFirstLogin ? "Senha criada com sucesso!" : "Login realizado com sucesso!",
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
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1A365D] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-background/95 backdrop-blur-sm p-8 rounded-lg shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold font-poppins mb-2">Assistente Financeiro</h1>
          <p className="text-muted-foreground">
            {isFirstLogin 
              ? "Crie sua senha para acessar o dashboard" 
              : "Acesse seu dashboard financeiro"}
          </p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
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
          
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {isFirstLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirme sua Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full bg-finance-primary hover:bg-finance-primary/90" 
            disabled={loading}
          >
            {loading ? "Processando..." : isFirstLogin ? "Criar Senha" : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
