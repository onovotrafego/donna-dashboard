/**
 * Funções auxiliares para o sistema de logging
 */

/**
 * Obtém uma versão ofuscada de um ID para logs
 * @param id O ID original a ser ofuscado
 * @returns Uma versão segura do ID para logs
 */
export const getObfuscatedId = (id: string | null | undefined): string => {
  if (!id) return 'unknown';
  if (id.length <= 8) return '***' + id.slice(-4);
  return id.slice(0, 4) + '...' + id.slice(-4);
};

/**
 * Sanitiza dados sensíveis antes de registrar em logs
 * @param data Dados a serem sanitizados
 * @returns Dados com informações sensíveis ofuscadas
 */
export const sanitizeForLogging = (data: Record<string, any>): Record<string, any> => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = [
    'password', 'senha', 'cpf', 'cnpj', 'token', 'apiKey', 'authToken',
    'creditCard', 'cardNumber', 'cvv', 'expiryDate', 'expirationDate'
  ];
  
  const result = { ...data };
  
  Object.keys(result).forEach(key => {
    const lowerKey = key.toLowerCase();
    
    // Ofusca campos sensíveis
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      result[key] = '***REDACTED***';
    }
    
    // Ofusca IDs longos
    else if ((lowerKey.endsWith('id') || lowerKey.endsWith('_id') || lowerKey === 'id') && 
             typeof result[key] === 'string' && 
             result[key].length > 8) {
      result[key] = getObfuscatedId(result[key]);
    }
    
    // Remove objetos grandes em produção
    else if (process.env.NODE_ENV !== 'development' && 
             typeof result[key] === 'object' && 
             result[key] !== null) {
      result[key] = '[Object]';
    }
  });
  
  return result;
};

/**
 * Formata uma mensagem de erro de forma segura
 * @param error O erro a ser formatado
 * @returns Uma string segura para logging
 */
export const formatErrorForLogging = (error: unknown): string => {
  if (!error) return 'No error information';
  
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n${error.stack || 'No stack trace'}`;
  }
  
  if (typeof error === 'object') {
    try {
      return JSON.stringify(sanitizeForLogging(error as Record<string, any>));
    } catch {
      return '[Non-serializable error object]';
    }
  }
  
  return String(error);
};
