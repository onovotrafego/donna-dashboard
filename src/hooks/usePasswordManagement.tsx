
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  createUserPassword, 
  loginWithPassword, 
  setSessionData 
} from '@/utils/auth';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para gerenciar operações relacionadas a senha
 */
export const usePasswordManagement = () => {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Criar uma nova senha para o usuário
  const createUserPasswordOp = async (userId: string, password: string, confirmPassword: string, userName: string) => {
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
      
      // Criar sessão Supabase para o usuário
      const email = `${userId}@donna.app`; // Email fictício para Supabase
      
      try {
        // Tenta criar usuário no Supabase (pode falhar se já existe)
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (signUpError && signUpError.message !== 'User already registered') {
          console.warn("[AUTH] Supabase signup error:", signUpError);
        }
        
        // Login com o usuário criado
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          console.warn("[AUTH] Supabase signin error:", signInError);
        }
      } catch (supabaseError) {
        console.error("[AUTH] Supabase auth error:", supabaseError);
      }
      
      // Definir sessão de autenticação local (fallback)
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

  // Fazer login (verificar senha)
  const loginUser = async (userId: string, password: string, passwordHash: string, userName: string) => {
    try {
      setLoading(true);
      setAuthError(null);

      if (!password) {
        setAuthError("Por favor, digite sua senha");
        toast({
          title: "Campo obrigatório",
          description: "Por favor, digite sua senha",
          variant: "destructive"
        });
        return false;
      }

      console.log("[AUTH] Tentando login para usuário:", userId);
      
      // Verificação usando a função loginWithPassword
      const isValid = await loginWithPassword(userId, password, passwordHash);
      
      if (!isValid) {
        console.log("[AUTH] Validação de senha falhou");
        setAuthError("Senha incorreta. Por favor, verifique e tente novamente.");
        toast({
          title: "Senha incorreta",
          description: "Por favor, verifique sua senha e tente novamente.",
          variant: "destructive"
        });
        return false;
      }
      
      console.log("[AUTH] Senha validada com sucesso, configurando sessão");
      
      // Try to authenticate with Supabase first
      const email = `${userId}@donna.app`; // Email fictício para Supabase
      
      try {
        // Tenta fazer login no Supabase
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        // Se não conseguir fazer login, pode ser porque o usuário não existe no Supabase
        if (signInError) {
          console.log("[AUTH] Supabase login failed, trying to create user:", signInError);
          
          // Tenta criar o usuário no Supabase
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          });
          
          if (signUpError) {
            console.warn("[AUTH] Couldn't create user in Supabase:", signUpError);
          } else {
            // Tenta login novamente
            await supabase.auth.signInWithPassword({
              email,
              password,
            });
          }
        }
      } catch (supabaseError) {
        console.error("[AUTH] Supabase auth error:", supabaseError);
      }
      
      // Definir sessão de autenticação (fallback para caso o Supabase falhe)
      await setSessionData(userId, userName || 'Usuário');
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao seu dashboard financeiro."
      });
      
      navigate('/');
      return true;
    } catch (error) {
      console.error('Erro de login:', error);
      setAuthError("Ocorreu um erro durante o login. Tente novamente.");
      toast({
        title: "Erro no sistema",
        description: "Ocorreu um erro durante o login. Tente novamente.",
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
    createUserPasswordOp,
    loginUser
  };
};
