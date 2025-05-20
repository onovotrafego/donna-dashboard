
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { checkUserByRemoteJid, checkUserByEmail, createUserPassword, setSessionData } from '@/utils/authUtils';
import UserIdForm from '@/components/auth/UserIdForm';
import CreatePasswordForm from '@/components/auth/CreatePasswordForm';
import LoginForm from '@/components/auth/LoginForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type AuthStep = 'checkUser' | 'createPassword' | 'enterPassword';
type LoginMethod = 'remotejid' | 'email';

const AuthPage: React.FC = () => {
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
          <>
            <Tabs 
              defaultValue="remotejid" 
              value={loginMethod}
              onValueChange={(value) => setLoginMethod(value as LoginMethod)}
              className="mb-6"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="remotejid">ID de Usuário</TabsTrigger>
                <TabsTrigger value="email">E-mail</TabsTrigger>
              </TabsList>
              <TabsContent value="remotejid">
                <form onSubmit={checkUserExists} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="remotejid" className="block text-sm font-medium">
                      ID de Usuário
                    </label>
                    <input
                      id="remotejid"
                      type="text"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      placeholder="Digite seu ID de usuário"
                      value={remotejid}
                      onChange={(e) => setRemotejid(e.target.value)}
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="w-full bg-finance-primary hover:bg-finance-primary/90 text-white py-2 px-4 rounded"
                    disabled={loading}
                  >
                    {loading ? "Verificando..." : "Continuar"}
                  </button>
                </form>
              </TabsContent>
              <TabsContent value="email">
                <form onSubmit={checkUserExists} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium">
                      E-mail
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      placeholder="Digite seu email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="w-full bg-finance-primary hover:bg-finance-primary/90 text-white py-2 px-4 rounded"
                    disabled={loading}
                  >
                    {loading ? "Verificando..." : "Continuar"}
                  </button>
                </form>
              </TabsContent>
            </Tabs>
          </>
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
