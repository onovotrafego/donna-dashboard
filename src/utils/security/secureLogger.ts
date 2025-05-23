import { format } from 'date-fns';
import { getSessionId } from './sessionUtils';

// Níveis de log
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// Interface para dados de log
interface LogData {
  timestamp: string;
  level: LogLevel;
  message: string;
  tags?: string[];
  sessionId?: string | null;
  userId?: string | null;
  error?: Error | string | null;
  context?: Record<string, any>;
  [key: string]: any;
}

// Configuração de níveis de log
const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Nível de log atual (pode ser configurado via variável de ambiente)
const CURRENT_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

/**
 * Registra uma mensagem de log
 */
const log = (level: LogLevel, message: string, data: Record<string, any> = {}) => {
  // Verifica se o nível de log é permitido
  if (LOG_LEVELS[level] > LOG_LEVELS[CURRENT_LEVEL]) {
    return;
  }

  const logData: LogData = {
    timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS'),
    level,
    message,
    sessionId: getSessionId(),
    userId: typeof window !== 'undefined' ? sessionStorage.getItem('user_id') : null,
    ...data,
  };

  // Remove dados sensíveis
  const sanitizedData = sanitizeLogData(logData);

  // Exibe o log no console no ambiente de desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    const logMethod = console[level] || console.log;
    logMethod(`[${sanitizedData.timestamp}] [${level.toUpperCase()}]`, sanitizedData.message, sanitizedData);
  }

  // Em produção, envia para um serviço de log
  if (process.env.NODE_ENV === 'production') {
    sendToLogService(sanitizedData);
  }
};

/**
 * Remove ou ofusca dados sensíveis dos logs
 */
const sanitizeLogData = (data: LogData): LogData => {
  const sensitiveFields = ['password', 'token', 'senha', 'cpf', 'cnpj', 'creditCard', 'cartaoCredito'];
  const sanitized: any = { ...data };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '***REDACTED***';
    }
  }

  return sanitized;
};

/**
 * Envia logs para um serviço de log externo
 */
const sendToLogService = async (data: LogData): Promise<void> => {
  try {
    // Substitua por sua implementação de envio de logs
    // Exemplo: fetch('https://seu-servico-de-logs.com/api/logs', { method: 'POST', body: JSON.stringify(data) });
  } catch (error) {
    console.error('Erro ao enviar log:', error);
  }
};

// Métodos de log auxiliares
const logger = {
  info: (message: string, data?: Record<string, any>) => log('info', message, data),
  warn: (message: string, data?: Record<string, any>) => log('warn', message, data),
  error: (message: string, error?: Error, data?: Record<string, any>) => {
    const errorData = error ? { 
      error: error.message, 
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      ...data 
    } : data;
    log('error', message, errorData);
  },
  debug: (message: string, data?: Record<string, any>) => log('debug', message, data),
};

export { logger };
