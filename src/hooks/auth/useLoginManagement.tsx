
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { loginWithPassword, setSessionData } from '@/utils/auth';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for managing login functionality
 */
export const useLoginManagement = () => {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loginUser = async (
    userId: string, 
    password: string, 
    passwordHash: string, 
    userName: string
  ) => {
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
      
      // Try to authenticate with Supabase directly using user credentials
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: `${userId}@donna.app`,
          password,
        });
        
        if (error) {
          console.log("[AUTH] Erro ao fazer login com Supabase:", error);
          
          // If login fails, try to sign up the user
          if (error.message === 'Invalid login credentials') {
            console.log("[AUTH] Usuário não existe no Supabase, tentando cadastrar...");
            
            const { error: signUpError } = await supabase.auth.signUp({
              email: `${userId}@donna.app`,
              password,
            });
            
            if (signUpError) {
              console.warn("[AUTH] Falha ao cadastrar no Supabase:", signUpError);
            } else {
              console.log("[AUTH] Usuário cadastrado no Supabase com sucesso!");
              // Try login again
              await supabase.auth.signInWithPassword({
                email: `${userId}@donna.app`,
                password,
              });
            }
          }
        } else {
          console.log("[AUTH] Autenticado com sucesso no Supabase!");
        }
      } catch (supabaseError) {
        console.error("[AUTH] Erro crítico com Supabase auth:", supabaseError);
      }
      
      // Definir sessão de autenticação local (será usada como fallback)
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
    loginUser
  };
};
