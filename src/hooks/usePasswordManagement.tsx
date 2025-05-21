
import { usePasswordCreation } from './auth/usePasswordCreation';
import { useLoginManagement } from './auth/useLoginManagement';

/**
 * Hook para gerenciar operações relacionadas a senha
 */
export const usePasswordManagement = () => {
  // Usar hooks especializados
  const passwordCreation = usePasswordCreation();
  const loginManagement = useLoginManagement();

  // Criar uma nova senha para o usuário
  const createUserPasswordOp = async (userId: string, password: string, confirmPassword: string, userName: string) => {
    return passwordCreation.createUserPasswordOp(userId, password, confirmPassword, userName);
  };

  // Fazer login com senha
  const loginUser = async (userId: string, password: string, passwordHash: string, userName: string) => {
    return loginManagement.loginUser(userId, password, passwordHash, userName);
  };

  // Combinar estados de ambos os hooks
  const loading = passwordCreation.loading || loginManagement.loading;
  const authError = passwordCreation.authError || loginManagement.authError;
  
  const setAuthError = (error: string | null) => {
    passwordCreation.setAuthError(error);
    loginManagement.setAuthError(error);
  };

  return {
    loading,
    authError,
    setAuthError,
    createUserPasswordOp,
    loginUser
  };
};
