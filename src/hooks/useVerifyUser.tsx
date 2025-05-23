
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  checkUserByRemoteJid, 
  checkUserByEmail,
} from '@/utils/auth';
import { logger } from '@/utils/security/secureLogger';

// Função para ofuscar IDs sensíveis
const getObfuscatedId = (id: string | null | undefined): string => {
  if (!id) return 'unknown';
  if (id.length <= 8) return '***' + id.slice(-4);
  return id.slice(0, 4) + '...' + id.slice(-4);
};

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

      logger.debug(`Verificando usuário`, {
        method,
        identifier: method === 'email' ? identifier.substring(0, 3) + '***' : getObfuscatedId(identifier),
        tags: ['auth', 'verification']
      });
      
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
        logger.error('Erro na consulta ao Supabase', error as Error, {
          method,
          tags: ['auth', 'verification', 'error']
        });
        throw error;
      }
      
      logger.debug("Usuário encontrado", {
        userId: getObfuscatedId(userData?.id),
        hasEmail: !!userData?.email,
        tags: ['auth', 'verification']
      });
      setClienteData(userData);
      
      // Verificar se o usuário tem uma senha
      const hasNoPassword = !userData.password_hash || 
                          userData.password_hash === "null" || 
                          userData.password_hash === "";
      
      logger.debug("Status da senha", {
        hasPassword: !hasNoPassword,
        userId: getObfuscatedId(userData?.id),
        tags: ['auth', 'password']
      });
      
      // Determinar próximo passo com base na existência de senha
      if (hasNoPassword) {
        logger.debug("Usuário precisa criar senha", {
          userId: getObfuscatedId(userData?.id),
          tags: ['auth', 'password']
        });
        setStep('createPassword');
      } else {
        logger.debug("Usuário tem senha, prosseguindo para login", {
          userId: getObfuscatedId(userData?.id),
          tags: ['auth', 'password']
        });
        setStep('enterPassword');
      }
      
      return userData;
    } catch (error) {
      logger.error('Erro de login', error as Error, {
        method,
        tags: ['auth', 'verification', 'error']
      });
      
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
