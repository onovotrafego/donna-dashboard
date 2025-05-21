
import { useVerifyUser } from './useVerifyUser';
import { usePasswordManagement } from './usePasswordManagement';

/**
 * Hook principal que combina operações de autenticação
 */
export const useAuthOperations = () => {
  // Usar hooks especializados
  const userVerification = useVerifyUser();
  const passwordManagement = usePasswordManagement();

  // Verificar se o usuário existe
  const verifyUserExists = userVerification.verifyUserExists;

  // Criar uma senha para o usuário
  const createUserPasswordOp = async (userId: string, password: string, confirmPassword: string) => {
    return passwordManagement.createUserPasswordOp(
      userId, 
      password, 
      confirmPassword, 
      userVerification.clienteData?.nome || 'Usuário'
    );
  };

  // Fazer login com senha
  const loginUser = async (password: string) => {
    return passwordManagement.loginUser(
      userVerification.clienteData.id,
      password,
      userVerification.clienteData.password_hash,
      userVerification.clienteData.nome || 'Usuário'
    );
  };

  // Combinar valores e funções de ambos os hooks
  return {
    ...userVerification,
    authError: userVerification.authError || passwordManagement.authError,
    loading: userVerification.loading || passwordManagement.loading,
    createUserPasswordOp,
    loginUser
  };
};
