
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { createUserPassword, setSessionData } from '@/utils/auth';

/**
 * Hook for managing password creation functionality
 */
export const usePasswordCreation = () => {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const createUserPasswordOp = async (
    userId: string, 
    password: string, 
    confirmPassword: string, 
    userName: string
  ) => {
    try {
      setAuthError(null);
      
      if (password !== confirmPassword) {
        setAuthError("As senhas não coincidem");
        toast({
          title: "Senhas não coincidem",
          description: "Por favor, confirme que as senhas são iguais",
          variant: "destructive"
        });
        return false;
      }
      
      if (password.length < 6) {
        setAuthError("Sua senha deve ter pelo menos 6 caracteres");
        toast({
          title: "Senha muito curta",
          description: "Sua senha deve ter pelo menos 6 caracteres",
          variant: "destructive"
        });
        return false;
      }
      
      setLoading(true);
      
      console.log("[AUTH] Criando senha para usuário:", userId);
      
      // Atualizar usuário com nova senha
      await createUserPassword(userId, password);
      
      console.log("[AUTH] Senha criada, configurando dados da sessão");
      
      // Definir sessão de autenticação local
      await setSessionData(userId, userName || 'Usuário');
      
      toast({
        title: "Senha criada com sucesso!",
        description: "Bem-vindo ao seu dashboard financeiro."
      });
      
      navigate('/');
      return true;
    } catch (error) {
      console.error('Erro ao criar senha:', error);
      setAuthError("Ocorreu um erro ao criar sua senha. Tente novamente.");
      toast({
        title: "Erro no sistema",
        description: "Ocorreu um erro ao criar sua senha. Tente novamente.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    authError,
    setAuthError,
    createUserPasswordOp
  };
};
