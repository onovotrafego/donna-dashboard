
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
    formState.clearError();
    
    const identifier = formState.loginMethod === 'remotejid' 
      ? formState.remotejid 
      : formState.email;
    
    console.log(`[AUTH] Checking if user exists with ${formState.loginMethod}: "${identifier}"`);
    
    const user = await authOps.verifyUserExists(identifier, formState.loginMethod);
    
    if (user) {
      console.log("[AUTH] User found:", user.id);
    }
  };

  // Handler para criar senha
  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    formState.clearError();
    
    console.log("[AUTH] Creating password for user:", authOps.clienteData?.id);
    
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
    
    console.log("[AUTH] Attempting login for user:", authOps.clienteData?.id);
    
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
