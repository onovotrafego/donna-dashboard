
import { UserRecord } from './types';
import { executeQuery, executeInsensitiveQuery } from './searchUtils';
import { logger } from '@/utils/security/secureLogger';

// Função para ofuscar IDs sensíveis
const getObfuscatedId = (id: string | null | undefined): string => {
  if (!id) return 'unknown';
  if (id.length <= 8) return '***' + id.slice(-4);
  return id.slice(0, 4) + '...' + id.slice(-4);
};

/**
 * Core search functions for exact matches
 */

// Função para buscar usuário pelo remotejid exato
export const searchUserByExactRemoteJid = async (remotejid: string): Promise<UserRecord | null> => {
  logger.debug(`Trying exact match for remotejid`, {
    remotejid: getObfuscatedId(remotejid),
    tags: ['auth', 'search']
  });
  
  const result = await executeQuery(
    'remotejid',
    remotejid, 
    'searchUserByExactRemoteJid'
  );
  
  if (result) {
    logger.debug(`Found user with exact match`, {
      userId: getObfuscatedId(result.id),
      tags: ['auth', 'search']
    });
  }
  
  return result;
};

// Função para buscar usuário por formato alternativo de remotejid
export const searchUserByAlternativeFormat = async (originalRemotejid: string, formattedRemotejid: string): Promise<UserRecord | null> => {
  logger.debug(`Trying alternative format match`, {
    formattedRemotejid: getObfuscatedId(formattedRemotejid),
    tags: ['auth', 'search']
  });
  
  const result = await executeQuery(
    'remotejid',
    formattedRemotejid,
    'searchUserByAlternativeFormat'
  );
  
  if (result) {
    logger.debug(`Found user with alternative format`, {
      userId: getObfuscatedId(result.id),
      tags: ['auth', 'search']
    });
  }
  
  return result;
};

/**
 * Email search functions
 */

// Função para buscar usuário pelo email exato
export const searchUserByExactEmail = async (email: string): Promise<UserRecord | null> => {
  logger.debug(`Trying exact match for email`, {
    email: email.substring(0, 3) + '***' + (email.includes('@') ? email.substring(email.indexOf('@')) : ''),
    tags: ['auth', 'search']
  });
  
  const result = await executeQuery(
    'email',
    email,
    'searchUserByExactEmail'
  );
  
  if (result) {
    logger.debug(`Found user with exact email match`, {
      userId: getObfuscatedId(result.id),
      tags: ['auth', 'search']
    });
  }
  
  return result;
};

// Função para buscar usuário pelo email com case insensitive
export const searchUserByInsensitiveEmail = async (email: string): Promise<UserRecord | null> => {
  logger.debug(`Trying case-insensitive search for email`, {
    email: email.substring(0, 3) + '***' + (email.includes('@') ? email.substring(email.indexOf('@')) : ''),
    tags: ['auth', 'search']
  });
  
  const result = await executeInsensitiveQuery(
    'email',
    email,
    'searchUserByInsensitiveEmail'
  );
  
  if (result) {
    logger.debug(`Found user with case-insensitive email match`, {
      userId: getObfuscatedId(result.id),
      tags: ['auth', 'search']
    });
  }
  
  return result;
};
