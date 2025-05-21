
import { supabase, debugSupabaseQuery } from '@/integrations/supabase/client';
import { UserRecord } from './types';
import { findUserByEmail, logAvailableEmails } from './searchUtils';

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
