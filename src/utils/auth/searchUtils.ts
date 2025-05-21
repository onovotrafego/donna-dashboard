
import { supabase, debugSupabaseQuery } from '@/integrations/supabase/client';
import type { UserRecord } from './types';

// Executa consulta exata na tabela de clientes
export const executeQuery = async (field: string, value: string, operationName: string): Promise<UserRecord | null> => {
  try {
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
    
    return result.data as UserRecord | null;
  } catch (error) {
    console.error(`[AUTH] Exception in executeQuery: ${error}`);
    return null;
  }
};

// Executa consulta case-insensitive na tabela de clientes
export const executeInsensitiveQuery = async (field: string, value: string, operationName: string): Promise<UserRecord | null> => {
  try {
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
    
    return result.data as UserRecord | null;
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
        return user;
      }
    }
  }
  
  return null;
};
