
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { checkUserByRemoteJid, createUserPassword, setSessionData } from '@/utils/authUtils';
import UserIdForm from '@/components/auth/UserIdForm';
import CreatePasswordForm from '@/components/auth/CreatePasswordForm';
import LoginForm from '@/components/auth/LoginForm';

type AuthStep = 'checkUser' | 'createPassword' | 'enterPassword';

const AuthPage: React.FC = () => {
  const [remotejid, setRemotejid] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<AuthStep>('checkUser');
  const [showPassword, setShowPassword] = useState(false);
  const [clienteData, setClienteData] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkUserExists = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trim the remotejid only when submitting
    const trimmedRemotejid = remotejid.trim();
    
    if (!trimmedRemotejid) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, digite seu ID de usuário",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const userData = await checkUserByRemoteJid(trimmedRemotejid);
      console.log("User found:", userData);
      setClienteData(userData);
      
      // Check if the user has a password - handle both null and "null" cases
      const hasNoPassword = !userData.password_hash || userData.password_hash === "null" || userData.password_hash === "";
      
      // Determine next step based on whether user has password
      if (hasNoPassword) {
        setStep('createPassword');
      } else {
        setStep('enterPassword');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: error.message === "Usuário não encontrado" ? "Usuário não encontrado" : "Erro no sistema",
        description: error.message === "Usuário não encontrado" 
          ? "Não encontramos um usuário com este ID. Verifique e tente novamente."
          : "Ocorreu um erro durante a verificação. Tente novamente.",
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
      
      // Verify password
      if (clienteData.password_hash !== password) {
        toast({
          title: "Senha incorreta",
          description: "Por favor, verifique sua senha e tente novamente.",
          variant: "destructive"
        });
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
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1A365D] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-background/95 backdrop-blur-sm p-8 rounded-lg shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold font-poppins mb-2">Assistente Financeiro</h1>
        </div>
        
        {step === 'checkUser' && (
          <UserIdForm
            remotejid={remotejid}
            setRemotejid={setRemotejid}
            loading={loading}
            onSubmit={checkUserExists}
          />
        )}
        
        {step === 'createPassword' && (
          <CreatePasswordForm
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            loading={loading}
            onSubmit={handleCreatePassword}
            onBack={() => setStep('checkUser')}
          />
        )}
        
        {step === 'enterPassword' && (
          <LoginForm
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            loading={loading}
            onSubmit={handleLogin}
            onBack={() => setStep('checkUser')}
          />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
