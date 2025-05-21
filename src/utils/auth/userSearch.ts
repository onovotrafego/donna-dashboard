
import { supabase, debugSupabaseQuery } from '@/integrations/supabase/client';

// Define a type for the user object to prevent excessive type instantiation
export type UserRecord = {
  id: string;
  email?: string | null;
  remotejid?: string | null;
  password_hash?: string | null;
  nome?: string | null;
  [key: string]: any; // Allow for other properties that may be present
};

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

/**
 * Advanced search utilities
 */

// Função para busca aproximada com LIKE
export const searchUserByLikeRemoteJid = async (searchFormats: string[]): Promise<UserRecord | null> => {
  for (const format of searchFormats) {
    console.log(`[AUTH] Trying LIKE search with format: ${format}`);
    
    const result = await debugSupabaseQuery(
      supabase
        .from('donna_clientes')
        .select('*')
        .ilike('remotejid', format)
        .limit(1),
      `searchUserByLikeRemoteJid with ${format}`
    );
    
    if (result.data && result.data.length > 0) {
      console.log(`[AUTH] Found user with LIKE match: ${result.data[0].id}`);
      console.log(`[AUTH] Matched remotejid in DB: ${result.data[0].remotejid}`);
      return result.data[0] as UserRecord;
    }
  }
  
  return null;
};

// Função para buscar usuários manualmente por email
export const searchUsersByManualEmailComparison = async (targetEmail: string): Promise<UserRecord | null> => {
  console.log(`[AUTH] Performing manual email comparison for: ${targetEmail}`);
  
  const result = await debugSupabaseQuery(
    supabase
      .from('donna_clientes')
      .select('*')
      .limit(100),
    'searchUsersByManualEmailComparison'
  );
  
  if (result.data && result.data.length > 0) {
    console.log(`[AUTH] Retrieved ${result.data.length} users for manual email comparison`);
    logAvailableEmails(result.data as UserRecord[]);
    
    const foundUser = findUserByEmail(result.data as UserRecord[], targetEmail);
    if (foundUser) {
      console.log(`[AUTH] Found user with matching email via manual comparison: ${foundUser.id}`);
      return foundUser;
    }
  }
  
  return null;
};

/**
 * Debug utilities
 */

// Função para obter uma lista de usuários para debug
export const getDebugUserList = async (): Promise<UserRecord[]> => {
  const result = await debugSupabaseQuery(
    supabase
      .from('donna_clientes')
      .select('id, remotejid')
      .limit(10),
    'getDebugUserList'
  );
  
  if (result.data && result.data.length > 0) {
    console.log("[AUTH] First 10 users in the database for comparison:");
    result.data.forEach(user => {
      console.log(`ID: ${user.id}, RemoteJID: ${user.remotejid}`);
    });
  }
  
  return (result.data as UserRecord[]) || [];
};

/**
 * Helper functions to reduce code duplication
 */

// Executa consulta exata na tabela de clientes
const executeQuery = async (field: string, value: string, operationName: string): Promise<UserRecord | null> => {
  const result = await debugSupabaseQuery(
    supabase
      .from('donna_clientes')
      .select('*')
      .eq(field, value)
      .maybeSingle(),
    operationName
  );
  
  return (result.data as UserRecord | null) || null;
};

// Executa consulta case-insensitive na tabela de clientes
const executeInsensitiveQuery = async (field: string, value: string, operationName: string): Promise<UserRecord | null> => {
  const result = await debugSupabaseQuery(
    supabase
      .from('donna_clientes')
      .select('*')
      .ilike(field, value)
      .maybeSingle(),
    operationName
  );
  
  return (result.data as UserRecord | null) || null;
};

// Loga emails disponíveis para debug
const logAvailableEmails = (users: UserRecord[]): void => {
  console.log("[AUTH] Available emails:", 
    users.map(user => user.email).filter(Boolean).join(', '));
};

// Compara e encontra usuário por email
const findUserByEmail = (users: UserRecord[], targetEmail: string): UserRecord | null => {
  const trimmedTargetEmail = targetEmail.trim().toLowerCase();
  
  for (const user of users) {
    if (user.email && typeof user.email === 'string') {
      const userEmail = user.email.trim().toLowerCase();
      
      console.log(`[AUTH] Comparing DB email: "${userEmail}" with input: "${trimmedTargetEmail}"`);
      
      if (userEmail === trimmedTargetEmail) {
        return user;
      }
    }
  }
  
  return null;
};
