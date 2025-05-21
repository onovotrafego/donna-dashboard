
import { supabase, debugSupabaseQuery } from '@/integrations/supabase/client';
import { UserRecord } from './types';

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
