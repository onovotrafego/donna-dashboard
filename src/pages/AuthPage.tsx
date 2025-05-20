
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import RemoteIdForm from '@/components/auth/RemoteIdForm';
import EmailForm from '@/components/auth/EmailForm';
import CreatePasswordForm from '@/components/auth/CreatePasswordForm';
import LoginForm from '@/components/auth/LoginForm';
import AuthTabs from '@/components/auth/AuthTabs';

const AuthPage: React.FC = () => {
  const {
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
    loginMethod,
    setLoginMethod,
    checkUserExists,
    handleCreatePassword,
    handleLogin
  } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1A365D] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-background/95 backdrop-blur-sm p-8 rounded-lg shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold font-poppins mb-2">Assistente Financeiro</h1>
        </div>
        
        {step === 'checkUser' && (
          <AuthTabs 
            loginMethod={loginMethod}
            setLoginMethod={setLoginMethod}
            remotejidForm={
              <RemoteIdForm 
                remotejid={remotejid}
                setRemotejid={setRemotejid}
                loading={loading}
                onSubmit={checkUserExists}
              />
            }
            emailForm={
              <EmailForm 
                email={email}
                setEmail={setEmail}
                loading={loading}
                onSubmit={checkUserExists}
              />
            }
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
