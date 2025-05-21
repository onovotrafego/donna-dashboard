
import { supabase, debugSupabaseQuery } from '@/integrations/supabase/client';

// Improved function to check if a user exists by remotejid
export const checkUserByRemoteJid = async (remotejid: string) => {
  if (!remotejid || remotejid.trim() === '') {
    console.error("[AUTH] Empty remotejid provided");
    throw new Error('ID de usuário não fornecido');
  }
  
  // Normalize remotejid by trimming and handling the "+" prefix consistently
  const trimmedRemotejid = remotejid.trim();
  const normalizedRemotejid = trimmedRemotejid.startsWith('+') 
    ? trimmedRemotejid 
    : `+${trimmedRemotejid}`;
  
  console.log("[AUTH] Looking for user with remotejid:", trimmedRemotejid);
  console.log("[AUTH] Normalized remotejid for search:", normalizedRemotejid);
  
  try {
    // Step 1: Try exact match with original input
    console.log("[AUTH] Trying exact match for original remotejid:", trimmedRemotejid);
    const exactMatchResult = await debugSupabaseQuery(
      supabase
        .from('donna_clientes')
        .select('*')
        .eq('remotejid', trimmedRemotejid)
        .maybeSingle(),
      'checkUserByRemoteJid - exact match with original'
    );
    
    if (exactMatchResult.data) {
      console.log("[AUTH] Found user with exact match (original):", exactMatchResult.data.id);
      return exactMatchResult.data;
    }
    
    // Step 2: Try exact match with normalized input (with + prefix)
    console.log("[AUTH] Trying exact match for normalized remotejid:", normalizedRemotejid);
    const normalizedMatchResult = await debugSupabaseQuery(
      supabase
        .from('donna_clientes')
        .select('*')
        .eq('remotejid', normalizedRemotejid)
        .maybeSingle(),
      'checkUserByRemoteJid - exact match with normalized'
    );
    
    if (normalizedMatchResult.data) {
      console.log("[AUTH] Found user with normalized match:", normalizedMatchResult.data.id);
      return normalizedMatchResult.data;
    }
    
    // Step 3: As a fallback, try without the "+" prefix if the original had one
    if (trimmedRemotejid.startsWith('+')) {
      const withoutPlusRemotejid = trimmedRemotejid.substring(1);
      console.log("[AUTH] Trying without + prefix:", withoutPlusRemotejid);
      
      const withoutPlusResult = await debugSupabaseQuery(
        supabase
          .from('donna_clientes')
          .select('*')
          .eq('remotejid', withoutPlusRemotejid)
          .maybeSingle(),
        'checkUserByRemoteJid - without plus'
      );
      
      if (withoutPlusResult.data) {
        console.log("[AUTH] Found user without + prefix:", withoutPlusResult.data.id);
        return withoutPlusResult.data;
      }
    }
    
    // Step 4: As a last resort, try a broader search with LIKE
    console.log("[AUTH] No exact matches found, trying LIKE search with both formats");
    
    // Create an array of possible formats to search
    const searchFormats = [
      `%${trimmedRemotejid}%`,
      trimmedRemotejid.startsWith('+') ? `%${trimmedRemotejid.substring(1)}%` : `%${trimmedRemotejid}%`,
      !trimmedRemotejid.startsWith('+') ? `%+${trimmedRemotejid}%` : `%${trimmedRemotejid}%`
    ];
    
    // Try each format
    for (const format of searchFormats) {
      console.log("[AUTH] Trying LIKE search with format:", format);
      const likeResult = await debugSupabaseQuery(
        supabase
          .from('donna_clientes')
          .select('*')
          .ilike('remotejid', format)
          .limit(1),
        `checkUserByRemoteJid - LIKE match with ${format}`
      );
      
      if (likeResult.data && likeResult.data.length > 0) {
        console.log("[AUTH] Found user with LIKE match:", likeResult.data[0].id);
        console.log("[AUTH] Matched remotejid in DB:", likeResult.data[0].remotejid);
        return likeResult.data[0];
      }
    }
    
    // If we get here, no user was found after exhausting all search options
    console.log("[AUTH] No user found with remotejid after trying all formats");
    console.log("[AUTH] Requested: ", trimmedRemotejid);
    console.log("[AUTH] Normalized: ", normalizedRemotejid);
    
    // Debug: Log all users and their remotejids for debugging
    const allUsersResult = await debugSupabaseQuery(
      supabase
        .from('donna_clientes')
        .select('id, remotejid')
        .limit(10),
      'checkUserByRemoteJid - debug list all users'
    );
    
    if (allUsersResult.data && allUsersResult.data.length > 0) {
      console.log("[AUTH] First 10 users in the database for comparison:");
      allUsersResult.data.forEach(user => {
        console.log(`ID: ${user.id}, RemoteJID: ${user.remotejid}`);
      });
    }
    
    throw new Error('Usuário não encontrado');
  } catch (error) {
    if (error.message === 'Usuário não encontrado') {
      throw error;
    }
    console.error("[AUTH] Error in checkUserByRemoteJid:", error);
    throw new Error(`Erro ao verificar usuário: ${error.message}`);
  }
};

// Simplified function to check if a user exists by email
export const checkUserByEmail = async (email: string) => {
  if (!email || email.trim() === '') {
    console.error("[AUTH] Empty email provided");
    throw new Error('Email não fornecido');
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  console.log("[AUTH] Looking for user with email:", trimmedEmail);
  
  try {
    // Step 1: Try exact match (most efficient)
    console.log("[AUTH] Trying exact match for email:", trimmedEmail);
    const exactMatchResult = await debugSupabaseQuery(
      supabase
        .from('donna_clientes')
        .select('*')
        .eq('email', trimmedEmail)
        .maybeSingle(),
      'checkUserByEmail - exact match'
    );
    
    if (exactMatchResult.error) {
      console.error("[AUTH] Error in exact match query:", exactMatchResult.error);
      throw new Error(`Erro ao consultar banco de dados: ${exactMatchResult.error.message}`);
    }
    
    // If we found an exact match, return it
    if (exactMatchResult.data) {
      console.log("[AUTH] Found user with exact match:", exactMatchResult.data.id);
      return exactMatchResult.data;
    }
    
    console.log("[AUTH] No exact match found, trying case-insensitive search");
    
    // Step 2: If no exact match, try case-insensitive search
    const caseInsensitiveResult = await debugSupabaseQuery(
      supabase
        .from('donna_clientes')
        .select('*')
        .ilike('email', trimmedEmail)
        .maybeSingle(),
      'checkUserByEmail - case insensitive'
    );
    
    if (caseInsensitiveResult.error) {
      console.error("[AUTH] Error in case-insensitive query:", caseInsensitiveResult.error);
      throw new Error(`Erro ao consultar banco de dados: ${caseInsensitiveResult.error.message}`);
    }
    
    // If we found a case-insensitive match, return it
    if (caseInsensitiveResult.data) {
      console.log("[AUTH] Found user with case-insensitive match:", caseInsensitiveResult.data.id);
      return caseInsensitiveResult.data;
    }
    
    // Step 3: As a last resort, get all users and try to match manually
    console.log("[AUTH] No case-insensitive match found, fetching all users to compare manually");
    const allUsersResult = await debugSupabaseQuery(
      supabase
        .from('donna_clientes')
        .select('*')
        .limit(100),
      'checkUserByEmail - all users'
    );
    
    if (allUsersResult.error) {
      console.error("[AUTH] Error fetching all users:", allUsersResult.error);
      throw new Error(`Erro ao consultar banco de dados: ${allUsersResult.error.message}`);
    }
    
    // Log how many users we got to check
    console.log("[AUTH] Retrieved", allUsersResult.data?.length || 0, "users for manual comparison");
    
    // Find any user with a matching email (ignoring case)
    if (allUsersResult.data && allUsersResult.data.length > 0) {
      // Log all emails for debugging
      console.log("[AUTH] Available emails:", allUsersResult.data.map(user => user.email).filter(Boolean).join(', '));
      
      for (const user of allUsersResult.data) {
        if (user.email && typeof user.email === 'string') {
          const userEmail = user.email.trim().toLowerCase();
          console.log(`[AUTH] Comparing DB email: "${userEmail}" with input: "${trimmedEmail}"`);
          
          if (userEmail === trimmedEmail) {
            console.log("[AUTH] Found user with matching email via manual comparison:", user.id);
            return user;
          }
        }
      }
    }
    
    // If we get here, no user was found
    console.log("[AUTH] No user found with email:", trimmedEmail);
    throw new Error('Email não encontrado');
  } catch (error) {
    if (error.message === 'Email não encontrado') {
      throw error;
    }
    console.error("[AUTH] Error in checkUserByEmail:", error);
    throw new Error(`Erro ao verificar email: ${error.message}`);
  }
};
