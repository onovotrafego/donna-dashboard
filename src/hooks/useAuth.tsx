
import { useAuthForm } from './useAuthForm';
import { useAuthOperations } from './useAuthOperations';

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
    
    const identifier = formState.loginMethod === 'remotejid' 
      ? formState.remotejid 
      : formState.email;
    
    await authOps.verifyUserExists(identifier, formState.loginMethod);
  };

  // Handler para criar senha
  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    await authOps.createUserPasswordOp(
      authOps.clienteData.id, 
      formState.password, 
      formState.confirmPassword
    );
  };

  // Handler para login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
