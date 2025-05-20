
import { useState } from 'react';

/**
 * Hook para gerenciar o estado do formulário de autenticação
 */
export const useAuthForm = () => {
  const [remotejid, setRemotejid] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'remotejid' | 'email'>('remotejid');
  const [formError, setFormError] = useState<string | null>(null);

  // Função para resetar todos os campos do formulário
  const resetForm = () => {
    setRemotejid('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFormError(null);
  };

  // Limpar erro específico
  const clearError = () => {
    setFormError(null);
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
    showPassword,
    setShowPassword,
    loginMethod,
    setLoginMethod,
    formError,
    setFormError,
    resetForm,
    clearError
  };
};
