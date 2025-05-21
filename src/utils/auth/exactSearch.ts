
import { UserRecord } from './types';
import { executeQuery, executeInsensitiveQuery } from './searchUtils';

/**
 * Core search functions for exact matches
 */

// Função para buscar usuário pelo remotejid exato
export const searchUserByExactRemoteJid = async (remotejid: string): Promise<UserRecord | null> => {
  console.log(`[AUTH] Trying exact match for remotejid: ${remotejid}`);
  
  const result = await executeQuery(
    'remotejid',
    remotejid, 
    'searchUserByExactRemoteJid'
  );
  
  if (result) {
    console.log(`[AUTH] Found user with exact match: ${result.id}`);
  }
  
  return result;
};

// Função para buscar usuário por formato alternativo de remotejid
export const searchUserByAlternativeFormat = async (originalRemotejid: string, formattedRemotejid: string): Promise<UserRecord | null> => {
  console.log(`[AUTH] Trying alternative format match: ${formattedRemotejid}`);
  
  const result = await executeQuery(
    'remotejid',
    formattedRemotejid,
    'searchUserByAlternativeFormat'
  );
  
  if (result) {
    console.log(`[AUTH] Found user with alternative format: ${result.id}`);
  }
  
  return result;
};

/**
 * Email search functions
 */

// Função para buscar usuário pelo email exato
export const searchUserByExactEmail = async (email: string): Promise<UserRecord | null> => {
  console.log(`[AUTH] Trying exact match for email: ${email}`);
  
  const result = await executeQuery(
    'email',
    email,
    'searchUserByExactEmail'
  );
  
  if (result) {
    console.log(`[AUTH] Found user with exact email match: ${result.id}`);
  }
  
  return result;
};

// Função para buscar usuário pelo email com case insensitive
export const searchUserByInsensitiveEmail = async (email: string): Promise<UserRecord | null> => {
  console.log(`[AUTH] Trying case-insensitive search for email: ${email}`);
  
  const result = await executeInsensitiveQuery(
    'email',
    email,
    'searchUserByInsensitiveEmail'
  );
  
  if (result) {
    console.log(`[AUTH] Found user with case-insensitive email match: ${result.id}`);
  }
  
  return result;
};
