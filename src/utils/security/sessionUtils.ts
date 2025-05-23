import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';

const CSRF_TOKEN_KEY = 'csrf_token';
const SESSION_ID_KEY = 'session_id';
const SESSION_EXPIRY_DAYS = 7;

/**
 * Gera um token CSRF seguro
 */
const generateCsrfToken = (): string => {
  const token = uuidv4();
  // Armazena o token em um cookie HttpOnly
  document.cookie = `${CSRF_TOKEN_KEY}=${token}; Path=/; Secure; SameSite=Strict; Max-Age=86400`; // 24h
  return token;
};

/**
 * Obtém o token CSRF atual
 */
const getCsrfToken = (): string | null => {
  return Cookies.get(CSRF_TOKEN_KEY) || null;
};

/**
 * Verifica se um token CSRF é válido
 */
const verifyCsrfToken = (token: string): boolean => {
  const storedToken = getCsrfToken();
  return !!storedToken && storedToken === token;
};

/**
 * Inicializa uma nova sessão segura
 */
const initSecureSession = (userId: string, userData: Record<string, any> = {}): void => {
  // Gera um novo ID de sessão
  const sessionId = uuidv4();
  
  // Armazena o ID da sessão em um cookie HttpOnly
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + SESSION_EXPIRY_DAYS);
  
  document.cookie = `${SESSION_ID_KEY}=${sessionId}; Path=/; Secure; HttpOnly; SameSite=Strict; Expires=${expiryDate.toUTCString()}`;
  
  // Armazena dados não sensíveis no sessionStorage
  sessionStorage.setItem('user_id', userId);
  if (userData.name) {
    sessionStorage.setItem('user_name', userData.name);
  }
  
  // Gera um novo token CSRF
  generateCsrfToken();
};

/**
 * Finaliza a sessão atual
 */
const destroySecureSession = (): void => {
  // Remove o cookie de sessão
  document.cookie = `${SESSION_ID_KEY}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `${CSRF_TOKEN_KEY}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  
  // Limpa o sessionStorage
  sessionStorage.clear();
};

/**
 * Verifica se há uma sessão ativa
 */
const hasActiveSession = (): boolean => {
  const sessionId = getSessionId();
  return !!sessionId;
};

/**
 * Obtém o ID da sessão atual
 */
const getSessionId = (): string | null => {
  const match = document.cookie.match(new RegExp(`(^| )${SESSION_ID_KEY}=([^;]+)`));
  return match ? match[2] : null;
};

export {
  generateCsrfToken,
  getCsrfToken,
  verifyCsrfToken,
  initSecureSession,
  destroySecureSession,
  hasActiveSession,
  getSessionId,
};
