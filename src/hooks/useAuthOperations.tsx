
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  checkUserByRemoteJid, 
  checkUserByEmail, 
  createUserPassword, 
  setSessionData 
} from '@/utils/authUtils';

type AuthStep = 'checkUser' | 'createPassword' | 'enterPassword';

/**
 * Hook para gerenciar operações de autenticação
 */
export const useAuthOperations = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<AuthStep>('checkUser');
  const [clienteData, setClienteData] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Verificar se o usuário existe (por remotejid ou email)
  const verifyUserExists = async (
    identifier: string, 
    method: 'remotejid' | 'email'
  ) => {
    try {
      setLoading(true);
      
      // Limpar qualquer dado em cache
      sessionStorage.clear();
      localStorage.clear();
      
      let userData;
      
      // Usar verificação diferente com base no método de login
      if (method === 'remotejid') {
        const trimmedRemotejid = identifier.trim();
        
        if (!trimmedRemotejid) {
          toast({
            title: "Campo obrigatório",
            description: "Por favor, digite seu ID de usuário",
            variant: "destructive"
          });
          return null;
        }
        
        userData = await checkUserByRemoteJid(trimmedRemotejid);
        console.log("[AUTH] User found by remotejid:", userData);
      } else {
        const trimmedEmail = identifier.trim();
        
        if (!trimmedEmail) {
          toast({
            title: "Campo obrigatório",
            description: "Por favor, digite seu email",
            variant: "destructive"
          });
          return null;
        }
        
        userData = await checkUserByEmail(trimmedEmail);
        console.log("[AUTH] User found by email:", userData);
      }
      
      setClienteData(userData);
      
      // Tratamento especial para conta de administrador master
      if (userData.id === 'admin-master') {
        setStep('enterPassword');
        return userData;
      }
      
      // Verificar se o usuário tem uma senha - lidar com casos null e "null"
      const hasNoPassword = !userData.password_hash || userData.password_hash === "null" || userData.password_hash === "";
      
      // Determinar próximo passo com base na existência de senha
      if (hasNoPassword) {
        setStep('createPassword');
      } else {
        setStep('enterPassword');
      }
      
      return userData;
    } catch (error: any) {
      console.error('[AUTH] Login error:', error);
      
      const errorMessage = error.message === "Usuário não encontrado" || error.message === "Email não encontrado"
        ? method === 'remotejid' 
          ? "Não encontramos um usuário com este ID. Verifique e tente novamente."
          : "Não encontramos um usuário com este email. Verifique e tente novamente."
        : "Ocorreu um erro durante a verificação. Tente novamente.";
      
      const errorTitle = error.message === "Usuário não encontrado" || error.message === "Email não encontrado"
        ? method === 'remotejid' ? "Usuário não encontrado" : "Email não encontrado"
        : "Erro no sistema";
      
      toast({
        title: errorTitle,
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
    if (password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Por favor, confirme que as senhas são iguais",
        variant: "destructive"
      });
      return false;
    }
    
    if (password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "Sua senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      setLoading(true);
      
      // Atualizar usuário com nova senha
      await createUserPassword(userId, password);
      
      // Definir sessão de autenticação
      setSessionData(userId, clienteData.nome);
      
      toast({
        title: "Senha criada com sucesso!",
        description: "Bem-vindo ao seu dashboard financeiro."
      });
      
      navigate('/');
      return true;
    } catch (error: any) {
      console.error('Create password error:', error);
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

      // Verificação especial para admin master
      if (clienteData.id === 'admin-master') {
        if (password === 'admin') {
          // Definir sessão de administrador com ID do cliente real para dados
          setSessionData('b33cb615-1235-4c5e-9c8d-3c15c2ad8336', 'Administrador');
          
          toast({
            title: "Login administrador realizado",
            description: "Bem-vindo ao painel administrativo."
          });
          
          navigate('/');
          return true;
        } else {
          toast({
            title: "Senha incorreta",
            description: "Senha de administrador inválida.",
            variant: "destructive"
          });
          return false;
        }
      }
      
      // Verificação de usuário regular
      if (clienteData.password_hash !== password) {
        toast({
          title: "Senha incorreta",
          description: "Por favor, verifique sua senha e tente novamente.",
          variant: "destructive"
        });
        return false;
      }
      
      // Definir sessão de autenticação
      setSessionData(clienteData.id, clienteData.nome);
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao seu dashboard financeiro."
      });
      
      navigate('/');
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
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
    verifyUserExists,
    createUserPasswordOp,
    loginUser
  };
};
