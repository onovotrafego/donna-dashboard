
import { supabase, debugSupabaseQuery } from '@/integrations/supabase/client';
import type { UserRecord } from './types';
import { PostgrestResponse } from '@supabase/supabase-js';

// Executa consulta exata na tabela de clientes
export const executeQuery = async (field: string, value: string, operationName: string): Promise<UserRecord | null> => {
  try {
    console.log(`[AUTH] Executando consulta em donna_clientes: ${field}=${value} (${operationName})`);
    
    const result = await debugSupabaseQuery(
      supabase
        .from('donna_clientes')
        .select('*')
        .eq(field, value)
        .maybeSingle(),
      operationName
    );
    
    if (result.error) {
      console.error(`[AUTH] Error executing query: ${result.error.message}`);
      return null;
    }
    
    // Se encontramos o cliente, registramos o ID para depuração
    if (result.data) {
      console.log(`[AUTH] Cliente encontrado com ID: ${result.data.id}`);
    }
    
    return result.data;
  } catch (error) {
    console.error(`[AUTH] Exception in executeQuery: ${error}`);
    return null;
  }
};

// Executa consulta case-insensitive na tabela de clientes
export const executeInsensitiveQuery = async (field: string, value: string, operationName: string): Promise<UserRecord | null> => {
  try {
    console.log(`[AUTH] Executando consulta insensitiva em donna_clientes: ${field}~${value} (${operationName})`);
    
    const result = await debugSupabaseQuery(
      supabase
        .from('donna_clientes')
        .select('*')
        .ilike(field, value)
        .maybeSingle(),
      operationName
    );
    
    if (result.error) {
      console.error(`[AUTH] Error executing insensitive query: ${result.error.message}`);
      return null;
    }
    
    // Se encontramos o cliente, registramos o ID para depuração
    if (result.data) {
      console.log(`[AUTH] Cliente encontrado com ID: ${result.data.id}`);
    }
    
    return result.data;
  } catch (error) {
    console.error(`[AUTH] Exception in executeInsensitiveQuery: ${error}`);
    return null;
  }
};

// Loga emails disponíveis para debug
export const logAvailableEmails = (users: Array<UserRecord>): void => {
  console.log("[AUTH] Available emails:", 
    users.map(user => user.email).filter(Boolean).join(', '));
};

// Compara e encontra usuário por email
export const findUserByEmail = (users: Array<UserRecord>, targetEmail: string): UserRecord | null => {
  if (!targetEmail || typeof targetEmail !== 'string') {
    console.error('[AUTH] Invalid email provided to findUserByEmail');
    return null;
  }

  const trimmedTargetEmail = targetEmail.trim().toLowerCase();
  
  if (!users || !Array.isArray(users)) {
    console.error('[AUTH] Invalid users array provided to findUserByEmail');
    return null;
  }
  
  for (const user of users) {
    if (user.email && typeof user.email === 'string') {
      const userEmail = user.email.trim().toLowerCase();
      
      console.log(`[AUTH] Comparing DB email: "${userEmail}" with input: "${trimmedTargetEmail}"`);
      
      if (userEmail === trimmedTargetEmail) {
        console.log(`[AUTH] Email match found for cliente ID: ${user.id}`);
        return user;
      }
    }
  }
  
  return null;
};

// Função para ajudar a depurar e garantir consistência de IDs
export const verifyClientIds = (): void => {
  const localStorageUserId = localStorage.getItem('user_id');
  console.log(`[AUTH] Verificando IDs de cliente - localStorage user_id: ${localStorageUserId}`);
  
  // Verificar a sessão do Supabase
  supabase.auth.getSession().then(({ data }) => {
    console.log(`[AUTH] Supabase auth user ID: ${data.session?.user?.id || 'none'}`);
    
    if (localStorageUserId && data.session?.user?.id && localStorageUserId !== data.session.user.id) {
      console.warn(`[AUTH] ATENÇÃO: ID do localStorage (${localStorageUserId}) é diferente do ID Supabase (${data.session.user.id})`);
      console.warn('[AUTH] Isso pode causar problemas nas consultas. Use client_id para tabelas relacionadas ao cliente.');
    }
  });
};
