import { format } from 'date-fns';
import { getSessionId } from './sessionUtils';

// Níveis de log
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// Interface para dados de log
export interface LogData {
  timestamp?: string;
  level?: LogLevel;
  message: string;
  tags?: string[];
  sessionId?: string | null;
  userId?: string | null;
  error?: Error | string | null;
  context?: Record<string, any>;
  [key: string]: any;
}

// Tipo para o segundo parâmetro dos métodos de log
export type LogOptions = Omit<LogData, 'message' | 'level'>;

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
const log = (level: LogLevel, message: string, options: LogOptions = {}) => {
  // Verifica se o nível de log é permitido
  if (LOG_LEVELS[level] > LOG_LEVELS[CURRENT_LEVEL]) {
    return;
  }

  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS');
  const sessionId = getSessionId();
  const userId = typeof window !== 'undefined' ? sessionStorage.getItem('user_id') : null;
  
  const logData: LogData = {
    timestamp,
    level,
    message,
    sessionId,
    userId,
    ...options
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
  info: (message: string, options?: LogOptions) => log('info', message, options || {}),
  warn: (message: string, options?: LogOptions) => log('warn', message, options || {}),
  error: (message: string, error?: Error | string | null, options?: LogOptions) => {
    const errorMessage = error instanceof Error ? error.message : error || message;
    const errorOptions: LogOptions = {
      ...options,
      error: errorMessage,
    };
    
    if (error instanceof Error && process.env.NODE_ENV !== 'production') {
      errorOptions.stack = error.stack;
    }
    
    log('error', message, errorOptions);
  },
  debug: (message: string, options?: LogOptions) => log('debug', message, options || {}),
};

export { logger };
