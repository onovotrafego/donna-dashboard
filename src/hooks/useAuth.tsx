
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
type LoginMethod = 'remotejid' | 'email';

export const useAuth = () => {
  const [remotejid, setRemotejid] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<AuthStep>('checkUser');
  const [showPassword, setShowPassword] = useState(false);
  const [clienteData, setClienteData] = useState<any>(null);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('remotejid');
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkUserExists = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Clear any cached data
      sessionStorage.clear();
      localStorage.clear();
      
      let userData;
      
      // Use different check based on login method
      if (loginMethod === 'remotejid') {
        const trimmedRemotejid = remotejid.trim();
        
        if (!trimmedRemotejid) {
          toast({
            title: "Campo obrigatório",
            description: "Por favor, digite seu ID de usuário",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        
        userData = await checkUserByRemoteJid(trimmedRemotejid);
        console.log("[AUTH] User found by remotejid:", userData);
      } else {
        const trimmedEmail = email.trim();
        
        if (!trimmedEmail) {
          toast({
            title: "Campo obrigatório",
            description: "Por favor, digite seu email",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        
        userData = await checkUserByEmail(trimmedEmail);
        console.log("[AUTH] User found by email:", userData);
      }
      
      setClienteData(userData);
      
      // Special handling for master admin account
      if (userData.id === 'admin-master') {
        setStep('enterPassword');
        setLoading(false);
        return;
      }
      
      // Check if the user has a password - handle both null and "null" cases
      const hasNoPassword = !userData.password_hash || userData.password_hash === "null" || userData.password_hash === "";
      
      // Determine next step based on whether user has password
      if (hasNoPassword) {
        setStep('createPassword');
      } else {
        setStep('enterPassword');
      }
    } catch (error: any) {
      console.error('[AUTH] Login error:', error);
      
      const errorMessage = error.message === "Usuário não encontrado" || error.message === "Email não encontrado"
        ? loginMethod === 'remotejid' 
          ? "Não encontramos um usuário com este ID. Verifique e tente novamente."
          : "Não encontramos um usuário com este email. Verifique e tente novamente."
        : "Ocorreu um erro durante a verificação. Tente novamente.";
      
      const errorTitle = error.message === "Usuário não encontrado" || error.message === "Email não encontrado"
        ? loginMethod === 'remotejid' ? "Usuário não encontrado" : "Email não encontrado"
        : "Erro no sistema";
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Por favor, confirme que as senhas são iguais",
        variant: "destructive"
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "Sua senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Update user with new password
      await createUserPassword(clienteData.id, password);
      
      // Set auth session
      setSessionData(clienteData.id, clienteData.nome);
      
      toast({
        title: "Senha criada com sucesso!",
        description: "Bem-vindo ao seu dashboard financeiro."
      });
      
      navigate('/');
    } catch (error: any) {
      console.error('Create password error:', error);
      toast({
        title: "Erro no sistema",
        description: "Ocorreu um erro ao criar sua senha. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // Special check for master admin
      if (clienteData.id === 'admin-master') {
        if (password === 'admin') {
          // Set admin session
          setSessionData('admin-master', 'Administrador');
          
          toast({
            title: "Login administrador realizado",
            description: "Bem-vindo ao painel administrativo."
          });
          
          navigate('/');
          return;
        } else {
          toast({
            title: "Senha incorreta",
            description: "Senha de administrador inválida.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }
      
      // Regular user verification
      if (clienteData.password_hash !== password) {
        toast({
          title: "Senha incorreta",
          description: "Por favor, verifique sua senha e tente novamente.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      // Set auth session
      setSessionData(clienteData.id, clienteData.nome);
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao seu dashboard financeiro."
      });
      
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Erro no sistema",
        description: "Ocorreu um erro durante o login. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    remotejid,
    setRemotejid,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    step,
    setStep,
    showPassword,
    setShowPassword,
    clienteData,
    loginMethod,
    setLoginMethod,
    checkUserExists,
    handleCreatePassword,
    handleLogin
  };
};
