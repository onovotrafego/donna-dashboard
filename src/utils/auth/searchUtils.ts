
import { supabase } from "@/integrations/supabase/client";
import { UserRecord } from './types';
import { logger } from '@/utils/security/secureLogger';

// Função para ofuscar IDs sensíveis
const getObfuscatedId = (id: string | null | undefined): string => {
  if (!id) return 'unknown';
  if (id.length <= 8) return '***' + id.slice(-4);
  return id.slice(0, 4) + '...' + id.slice(-4);
};

/**
 * Verificar IDs de cliente presentes no aplicativo
 * Função de diagnóstico para depuração
 */
export const verifyClientIds = () => {
  if (typeof window === 'undefined') {
    logger.debug('Executando no servidor, localStorage não disponível', {
      tags: ['auth', 'utils']
    });
    return;
  }

  try {
    const localStorageId = localStorage.getItem('user_id');
    logger.debug('Client ID no localStorage', {
      clientId: getObfuscatedId(localStorageId),
      tags: ['auth', 'utils']
    });
    
    if (localStorageId) {
      logger.debug('Client ID encontrado no localStorage', {
        clientId: getObfuscatedId(localStorageId),
        tags: ['auth', 'utils']
      });
    } else {
      logger.debug('Nenhum client_id encontrado no localStorage', {
        tags: ['auth', 'utils']
      });
    }
  } catch (error) {
    logger.error('Erro ao acessar localStorage', error as Error, {
      tags: ['auth', 'utils', 'error']
    });
  }
};

// Helper function to safely convert database results to UserRecord
const safeUserRecord = (data: any): UserRecord => {
  return {
    id: data.id,
    email: data.email || null,
    remotejid: data.remotejid || null,
    password_hash: data.password_hash || null,
    nome: data.nome || null,
    status_assinatura_cliente: data.status_assinatura_cliente || null,
    data_expiracao: data.data_expiracao || null,
    created_at: data.created_at || null,
    completou_cadastro: data.completou_cadastro || null,
  };
};

/**
 * Executa uma consulta padrão ao banco de dados
 */
export const executeQuery = async (field: string, value: string, functionName: string): Promise<UserRecord | null> => {
  const maskedValue = field === 'email' 
    ? value.substring(0, 3) + '***' + (value.includes('@') ? value.substring(value.indexOf('@')) : '')
    : getObfuscatedId(value);
    
  logger.debug(`${functionName}: Buscando por ${field}`, {
    field,
    value: maskedValue,
    tags: ['auth', 'search']
  });
  
  const { data, error } = await supabase
    .from('donna_clientes')
    .select('*')
    .eq(field, value)
    .limit(1);
    
  if (error) {
    logger.error(`${functionName} error`, error as Error, {
      field,
      value: maskedValue,
      tags: ['auth', 'search', 'error']
    });
    return null;
  }
  
  if (data && data.length > 0) {
    logger.debug(`${functionName}: Encontrado usuário`, {
      userId: getObfuscatedId(data[0].id),
      field,
      tags: ['auth', 'search']
    });
    return safeUserRecord(data[0]);
  }
  
  logger.debug(`${functionName}: Nenhum usuário encontrado`, {
    field,
    value: maskedValue,
    tags: ['auth', 'search']
  });
  return null;
};

/**
 * Executa uma consulta insensitive ao banco de dados (ignora maiúsculas/minúsculas)
 */
export const executeInsensitiveQuery = async (field: string, value: string, functionName: string): Promise<UserRecord | null> => {
  console.log(`[AUTH] ${functionName}: Buscando por ${field}=${value} (insensitive)`);
  
  const { data, error } = await supabase
    .from('donna_clientes')
    .select('*')
    .ilike(field, value)
    .limit(1);
    
  if (error) {
    console.error(`[AUTH] ${functionName} error:`, error);
    return null;
  }
  
  if (data && data.length > 0) {
    console.log(`[AUTH] ${functionName}: Encontrado usuário com id=${data[0].id}`);
    return safeUserRecord(data[0]);
  }
  
  console.log(`[AUTH] ${functionName}: Nenhum usuário encontrado`);
  return null;
};

/**
 * Encontra um usuário pelo email na lista de registros
 */
export const findUserByEmail = (users: Array<Record<string, any>>, targetEmail: string): UserRecord | null => {
  console.log(`[AUTH] findUserByEmail: Procurando por email ${targetEmail} entre ${users.length} usuários`);
  
  const normalizedTargetEmail = targetEmail.toLowerCase().trim();
  
  for (const user of users) {
    if (user.email && user.email.toLowerCase().trim() === normalizedTargetEmail) {
      console.log(`[AUTH] findUserByEmail: Encontrado usuário com email correspondente id=${user.id}`);
      return safeUserRecord(user);
    }
  }
  
  console.log('[AUTH] findUserByEmail: Nenhum usuário encontrado com o email correspondente');
  return null;
};

/**
 * Registra os emails disponíveis para depuração
 */
export const logAvailableEmails = (users: Array<Record<string, any>>): void => {
  console.log('[AUTH] logAvailableEmails: Lista de emails disponíveis para comparação:');
  
  const emails = users
    .filter(user => user.email)
    .map(user => user.email);
    
  if (emails.length > 0) {
    console.log('[AUTH] Emails disponíveis:', emails);
  } else {
    console.log('[AUTH] Nenhum email disponível nos registros de usuários');
  }
};
