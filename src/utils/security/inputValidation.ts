import DOMPurify from 'dompurify';

/**
 * Sanitiza uma string para prevenir XSS
 */
const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Não permite nenhuma tag HTML
    ALLOWED_ATTR: [], // Não permite nenhum atributo
    KEEP_CONTENT: false
  }).trim();
};

/**
 * Valida um endereço de email
 */
const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida um número de telefone brasileiro
 */
const isValidPhone = (phone: string): boolean => {
  if (!phone) return false;
  // Formato: (XX) XXXX-XXXX ou (XX) XXXXX-XXXX ou XX XXXX-XXXX ou XX XXXXX-XXXX
  const phoneRegex = /^(\(?\d{2}\)?\s?)(\d{4,5}[-\s]?\d{4})$/;
  return phoneRegex.test(phone);
};

/**
 * Valida um CPF
 */
const isValidCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/[\D]/g, '');
  
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let rest = sum % 11;
  const digit1 = rest < 2 ? 0 : 11 - rest;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  rest = sum % 11;
  const digit2 = rest < 2 ? 0 : 11 - rest;
  
  return parseInt(cpf.charAt(9)) === digit1 && parseInt(cpf.charAt(10)) === digit2;
};

/**
 * Valida uma senha forte
 */
const isStrongPassword = (password: string): { isValid: boolean; message: string } => {
  if (!password || password.length < 8) {
    return { isValid: false, message: 'A senha deve ter pelo menos 8 caracteres' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'A senha deve conter pelo menos uma letra maiúscula' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'A senha deve conter pelo menos uma letra minúscula' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'A senha deve conter pelo menos um número' };
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { isValid: false, message: 'A senha deve conter pelo menos um caractere especial' };
  }
  
  return { isValid: true, message: 'Senha forte' };
};

export {
  sanitizeInput,
  isValidEmail,
  isValidPhone,
  isValidCPF,
  isStrongPassword,
};
