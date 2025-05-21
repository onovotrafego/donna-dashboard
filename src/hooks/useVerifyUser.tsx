
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  checkUserByRemoteJid, 
  checkUserByEmail,
} from '@/utils/auth';

export type AuthStep = 'checkUser' | 'createPassword' | 'enterPassword';

/**
 * Hook para gerenciar a verificação de existência de usuário
 */
export const useVerifyUser = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<AuthStep>('checkUser');
  const [clienteData, setClienteData] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();

  // Verificar se o usuário existe (por remotejid ou email)
  const verifyUserExists = async (
    identifier: string, 
    method: 'remotejid' | 'email'
  ) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // Limpar qualquer dado em cache
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_expires_at');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_name');
      
      if (!identifier || identifier.trim() === '') {
        const errorMessage = method === 'remotejid' 
          ? "Por favor, digite seu ID de usuário" 
          : "Por favor, digite seu email";
        
        setAuthError(errorMessage);
        toast({
          title: "Campo obrigatório",
          description: errorMessage,
          variant: "destructive"
        });
        return null;
      }

      console.log(`[AUTH] Verificando usuário com ${method}: "${identifier}"`);
      
      // Usar verificação diferente com base no método de login
      let userData = null;
      
      try {
        if (method === 'remotejid') {
          userData = await checkUserByRemoteJid(identifier);
        } else {
          userData = await checkUserByEmail(identifier);
        }
        
        if (!userData) {
          throw new Error(method === 'remotejid' ? "Usuário não encontrado" : "Email não encontrado");
        }
      } catch (error) {
        console.error('[AUTH] Erro na consulta ao Supabase:', error);
        throw error;
      }
      
      console.log("[AUTH] Usuário encontrado:", userData);
      setClienteData(userData);
      
      // Verificar se o usuário tem uma senha
      const hasNoPassword = !userData.password_hash || 
                          userData.password_hash === "null" || 
                          userData.password_hash === "";
      
      console.log("[AUTH] Status da senha:", hasNoPassword ? "Sem senha" : "Com senha");
      
      // Determinar próximo passo com base na existência de senha
      if (hasNoPassword) {
        console.log("[AUTH] Usuário precisa criar senha");
        setStep('createPassword');
      } else {
        console.log("[AUTH] Usuário tem senha, prosseguindo para login");
        setStep('enterPassword');
      }
      
      return userData;
    } catch (error) {
      console.error('[AUTH] Erro de login:', error);
      
      const errorMessage = error.message === "Usuário não encontrado" || error.message === "Email não encontrado"
        ? method === 'remotejid' 
          ? "Não encontramos um usuário com este ID. Verifique e tente novamente."
          : "Não encontramos um usuário com este email. Verifique e tente novamente."
        : "Ocorreu um erro durante a verificação. Tente novamente.";
      
      setAuthError(errorMessage);
      
      toast({
        title: method === 'remotejid' ? "Usuário não encontrado" : "Email não encontrado",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    step,
    setStep,
    clienteData,
    setClienteData,
    authError,
    setAuthError,
    verifyUserExists,
  };
};
