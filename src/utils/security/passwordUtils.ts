import bcrypt from 'bcryptjs';
import { isStrongPassword } from './inputValidation';

const SALT_ROUNDS = 12;

/**
 * Gera um hash seguro para uma senha
 */
const hashPassword = async (password: string): Promise<string> => {
  const { isValid, message } = isStrongPassword(password);
  if (!isValid) {
    throw new Error(`Senha fraca: ${message}`);
  }
  
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

/**
 * Verifica se uma senha corresponde a um hash
 */
const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  if (!password || !hashedPassword) return false;
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Gera uma senha aleatória segura
 */
const generateSecurePassword = (length = 16): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
  let password = '';
  
  // Garante que a senha contenha pelo menos um de cada tipo de caractere
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const specials = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
  
  // Adiciona pelo menos um de cada tipo
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += specials.charAt(Math.floor(Math.random() * specials.length));
  
  // Preenche o resto da senha com caracteres aleatórios
  for (let i = password.length; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Embaralha os caracteres
  return password.split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};

/**
 * Verifica se uma senha foi comprometida em vazamentos de dados
 * (Implementação básica - em produção, use uma API como Have I Been Pwned)
 */
const isPasswordCompromised = async (password: string): Promise<boolean> => {
  // Em produção, substitua por uma chamada para uma API como Have I Been Pwned
  // Esta é apenas uma implementação de exemplo
  const commonPasswords = [
    '123456', 'password', '123456789', '12345678', '12345',
    '1234567', '1234567890', 'senha', '123123', '111111'
  ];
  
  return commonPasswords.includes(password.toLowerCase());
};

export {
  hashPassword,
  verifyPassword,
  generateSecurePassword,
  isPasswordCompromised,
};
