import { supabase, setAuthToken, debugSupabaseQuery } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs-react';

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

// Create a new password for the user (with hashing)
export const createUserPassword = async (userId: string, password: string) => {
  if (!userId || !password) {
    console.error("[AUTH] Missing userId or password");
    throw new Error('Dados incompletos para criar senha');
  }
  
  console.log("[AUTH] Creating password for user:", userId);
  
  try {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("[AUTH] Password hashed successfully");
    
    const updateResult = await debugSupabaseQuery(
      supabase
        .from('donna_clientes')
        .update({ 
          password_hash: hashedPassword, 
          completou_cadastro: true 
        })
        .eq('id', userId),
      'createUserPassword - update user'
    );
    
    if (updateResult.error) {
      console.error("[AUTH] Error updating password:", updateResult.error);
      throw new Error('Não foi possível definir sua senha');
    }
    
    console.log("[AUTH] Password created successfully");
  } catch (error) {
    console.error("[AUTH] Error in createUserPassword:", error);
    throw new Error(`Erro ao criar senha: ${error.message}`);
  }
};

// Set user session data in browser storage and create auth token
export const setSessionData = (userId: string, userName: string) => {
  if (!userId) {
    console.error("[AUTH] Missing userId when setting session data");
    throw new Error('ID de usuário não fornecido para criar sessão');
  }
  
  console.log("[AUTH] Setting session data for user:", userId, userName);
  
  try {
    // Generate a simple token (in a real app you'd want to use JWT)
    const token = uuidv4();
    
    // Set token in localStorage with 24h expiration
    setAuthToken(token);
    
    // Set user data
    localStorage.setItem('user_id', userId);
    localStorage.setItem('user_name', userName || 'Usuário');
    
    console.log("[AUTH] Session data set successfully");
  } catch (error) {
    console.error("[AUTH] Error setting session data:", error);
    throw new Error('Erro ao configurar sessão do usuário');
  }
};

// Login function with password comparison
export const loginWithPassword = async (userId: string, password: string, storedPasswordHash: string) => {
  if (!userId || !password) {
    console.error("[AUTH] Missing userId or password for login");
    return false;
  }
  
  console.log("[AUTH] Attempting login for user:", userId);
  
  try {
    // Make sure we have a password hash to compare against
    if (!storedPasswordHash) {
      console.error("[AUTH] No stored password hash for user");
      return false;
    }
    
    // Check if it's a bcrypt hash
    if (storedPasswordHash.startsWith('$2a$') || 
        storedPasswordHash.startsWith('$2b$') || 
        storedPasswordHash.startsWith('$2y$')) {
      // It's a bcrypt hash, compare with bcrypt
      console.log("[AUTH] Using bcrypt to compare passwords");
      const isMatch = await bcrypt.compare(password, storedPasswordHash);
      
      if (isMatch) {
        console.log("[AUTH] Login successful with bcrypt password match");
        return true;
      } else {
        console.log("[AUTH] Login failed - password mismatch with bcrypt");
        return false;
      }
    } else {
      // Legacy case: direct comparison (not recommended)
      console.log("[AUTH] Using direct comparison (legacy) for passwords");
      if (password === storedPasswordHash) {
        console.log("[AUTH] Login successful with direct password match (legacy)");
        return true;
      } else {
        console.log("[AUTH] Login failed - password mismatch with direct comparison");
        return false;
      }
    }
    
    // If we get here, the login failed
    return false;
  } catch (error) {
    console.error("[AUTH] Error comparing passwords:", error);
    return false;
  }
};
