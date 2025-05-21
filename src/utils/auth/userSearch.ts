
import { supabase, debugSupabaseQuery } from '@/integrations/supabase/client';

// Função para buscar usuário pelo remotejid exato
export const searchUserByExactRemoteJid = async (remotejid: string) => {
  console.log(`[AUTH] Trying exact match for remotejid: ${remotejid}`);
  
  const result = await debugSupabaseQuery(
    supabase
      .from('donna_clientes')
      .select('*')
      .eq('remotejid', remotejid)
      .maybeSingle(),
    'searchUserByExactRemoteJid'
  );
  
  if (result.data) {
    console.log(`[AUTH] Found user with exact match: ${result.data.id}`);
    return result.data;
  }
  
  return null;
};

// Função para buscar usuário por formato alternativo de remotejid
export const searchUserByAlternativeFormat = async (originalRemotejid: string, formattedRemotejid: string) => {
  console.log(`[AUTH] Trying alternative format match: ${formattedRemotejid}`);
  
  const result = await debugSupabaseQuery(
    supabase
      .from('donna_clientes')
      .select('*')
      .eq('remotejid', formattedRemotejid)
      .maybeSingle(),
    'searchUserByAlternativeFormat'
  );
  
  if (result.data) {
    console.log(`[AUTH] Found user with alternative format: ${result.data.id}`);
    return result.data;
  }
  
  return null;
};

// Função para busca aproximada com LIKE
export const searchUserByLikeRemoteJid = async (searchFormats: string[]) => {
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
      return result.data[0];
    }
  }
  
  return null;
};

// Função para obter uma lista de usuários para debug
export const getDebugUserList = async () => {
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
  
  return result.data || [];
};

// Função para buscar usuário pelo email exato
export const searchUserByExactEmail = async (email: string) => {
  console.log(`[AUTH] Trying exact match for email: ${email}`);
  
  const result = await debugSupabaseQuery(
    supabase
      .from('donna_clientes')
      .select('*')
      .eq('email', email)
      .maybeSingle(),
    'searchUserByExactEmail'
  );
  
  if (result.data) {
    console.log(`[AUTH] Found user with exact email match: ${result.data.id}`);
    return result.data;
  }
  
  return null;
};

// Função para buscar usuário pelo email com case insensitive
export const searchUserByInsensitiveEmail = async (email: string) => {
  console.log(`[AUTH] Trying case-insensitive search for email: ${email}`);
  
  const result = await debugSupabaseQuery(
    supabase
      .from('donna_clientes')
      .select('*')
      .ilike('email', email)
      .maybeSingle(),
    'searchUserByInsensitiveEmail'
  );
  
  if (result.data) {
    console.log(`[AUTH] Found user with case-insensitive email match: ${result.data.id}`);
    return result.data;
  }
  
  return null;
};

// Função para buscar usuários manualmente por email
export const searchUsersByManualEmailComparison = async (targetEmail: string) => {
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
    
    // Log available emails for debugging
    console.log("[AUTH] Available emails:", 
      result.data.map(user => user.email).filter(Boolean).join(', '));
    
    for (const user of result.data) {
      if (user.email && typeof user.email === 'string') {
        const userEmail = user.email.trim().toLowerCase();
        const trimmedTargetEmail = targetEmail.trim().toLowerCase();
        
        console.log(`[AUTH] Comparing DB email: "${userEmail}" with input: "${trimmedTargetEmail}"`);
        
        if (userEmail === trimmedTargetEmail) {
          console.log(`[AUTH] Found user with matching email via manual comparison: ${user.id}`);
          return user;
        }
      }
    }
  }
  
  return null;
};
