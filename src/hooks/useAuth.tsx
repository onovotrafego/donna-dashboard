
import { useAuthForm } from './useAuthForm';
import { useAuthOperations } from './useAuthOperations';
import { logger } from '@/utils/security/secureLogger';

// Função para ofuscar IDs sensíveis
const getObfuscatedId = (id: string | null | undefined): string => {
  if (!id) return 'unknown';
  if (id.length <= 8) return '***' + id.slice(-4);
  return id.slice(0, 4) + '...' + id.slice(-4);
};

/**
 * Hook principal que combina a gestão de formulário e operações de autenticação
 */
export const useAuth = () => {
  // Usar hooks especializados
  const formState = useAuthForm();
  const authOps = useAuthOperations();

  // Handler para verificar existência do usuário
  const checkUserExists = async (e: React.FormEvent) => {
    e.preventDefault();
    formState.clearError();
    
    const identifier = formState.loginMethod === 'remotejid' 
      ? formState.remotejid 
      : formState.email;
    
    logger.debug(`Checking if user exists`, {
      method: formState.loginMethod,
      identifier: formState.loginMethod === 'email' ? identifier.substring(0, 3) + '***' : getObfuscatedId(identifier),
      tags: ['auth', 'verification']
    });
    
    const user = await authOps.verifyUserExists(identifier, formState.loginMethod);
    
    if (user) {
      logger.debug("User found", {
        userId: getObfuscatedId(user.id),
        tags: ['auth', 'verification']
      });
    }
  };

  // Handler para criar senha
  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    formState.clearError();
    
    logger.debug("Creating password for user", {
      userId: getObfuscatedId(authOps.clienteData?.id),
      tags: ['auth', 'password']
    });
    
    await authOps.createUserPasswordOp(
      authOps.clienteData.id, 
      formState.password, 
      formState.confirmPassword
    );
  };

  // Handler para login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    formState.clearError();
    
    logger.debug("Attempting login for user", {
      userId: getObfuscatedId(authOps.clienteData?.id),
      tags: ['auth', 'login']
    });
    
    await authOps.loginUser(formState.password);
  };

  // Exportar todas as propriedades e métodos necessários
  return {
    ...formState,
    ...authOps,
    checkUserExists,
    handleCreatePassword,
    handleLogin
  };
};
