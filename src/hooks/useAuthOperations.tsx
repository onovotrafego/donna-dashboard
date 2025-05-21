
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  checkUserByRemoteJid, 
  checkUserByEmail, 
  createUserPassword, 
  setSessionData,
  loginWithPassword
} from '@/utils/authUtils';

type AuthStep = 'checkUser' | 'createPassword' | 'enterPassword';

/**
 * Hook para gerenciar operações de autenticação
 */
export const useAuthOperations = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<AuthStep>('checkUser');
  const [clienteData, setClienteData] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
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

  // Criar uma nova senha para o usuário
  const createUserPasswordOp = async (userId: string, password: string, confirmPassword: string) => {
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
      
      // Definir sessão de autenticação
      setSessionData(userId, clienteData.nome || 'Usuário');
      
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
  const loginUser = async (password: string) => {
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

      console.log("[AUTH] Tentando login para usuário:", clienteData.id);
      
      // Verificação usando a função loginWithPassword
      const isValid = await loginWithPassword(
        clienteData.id, 
        password, 
        clienteData.password_hash
      );
      
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
      
      // Definir sessão de autenticação
      setSessionData(clienteData.id, clienteData.nome || 'Usuário');
      
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
    step,
    setStep,
    clienteData,
    authError,
    setAuthError,
    verifyUserExists,
    createUserPasswordOp,
    loginUser
  };
};
