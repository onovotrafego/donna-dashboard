
import { supabase } from '@/integrations/supabase/client';
import * as exactSearch from './exactSearch';
import * as advancedSearch from './advancedSearch';
import * as debugSearch from './debugSearch';
import * as remotejidFormatter from './remotejidFormatter';

// Improved function to check if a user exists by remotejid
export const checkUserByRemoteJid = async (remotejid: string) => {
  if (!remotejid || remotejid.trim() === '') {
    console.error("[AUTH] Empty remotejid provided");
    throw new Error('ID de usuário não fornecido');
  }
  
  // Normalize remotejid by trimming
  const trimmedRemotejid = remotejid.trim();
  // Create normalized version with + prefix
  const normalizedRemotejid = remotejidFormatter.normalizeRemotejid(trimmedRemotejid);
  
  console.log("[AUTH] Looking for user with remotejid:", trimmedRemotejid);
  console.log("[AUTH] Normalized remotejid for search:", normalizedRemotejid);
  
  try {
    // Step 1: Try exact match with original input
    console.log("[AUTH] Trying exact match for original remotejid:", trimmedRemotejid);
    let userData = await exactSearch.searchUserByExactRemoteJid(trimmedRemotejid);
    
    if (userData) {
      return userData;
    }
    
    // Step 2: Try exact match with normalized input (with + prefix)
    userData = await exactSearch.searchUserByAlternativeFormat(trimmedRemotejid, normalizedRemotejid);
    
    if (userData) {
      return userData;
    }
    
    // Step 3: As a fallback, try without the "+" prefix if the original had one
    if (trimmedRemotejid.startsWith('+')) {
      const withoutPlusRemotejid = remotejidFormatter.removeRemotejidPlus(trimmedRemotejid);
      console.log("[AUTH] Trying without + prefix:", withoutPlusRemotejid);
      
      userData = await exactSearch.searchUserByAlternativeFormat(trimmedRemotejid, withoutPlusRemotejid);
      
      if (userData) {
        return userData;
      }
    }
    
    // Step 4: As a last resort, try a broader search with LIKE
    console.log("[AUTH] No exact matches found, trying LIKE search with both formats");
    
    // Create an array of possible formats to search
    const searchFormats = remotejidFormatter.generateSearchFormats(trimmedRemotejid);
    
    userData = await advancedSearch.searchUserByLikeRemoteJid(searchFormats);
    
    if (userData) {
      return userData;
    }
    
    // If we get here, no user was found after exhausting all search options
    console.log("[AUTH] No user found with remotejid after trying all formats");
    console.log("[AUTH] Requested: ", trimmedRemotejid);
    console.log("[AUTH] Normalized: ", normalizedRemotejid);
    
    // Debug: Log all users and their remotejids for debugging
    await debugSearch.getDebugUserList();
    
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
    let userData = await exactSearch.searchUserByExactEmail(trimmedEmail);
    
    if (userData) {
      return userData;
    }
    
    // Step 2: If no exact match, try case-insensitive search
    userData = await exactSearch.searchUserByInsensitiveEmail(trimmedEmail);
    
    if (userData) {
      return userData;
    }
    
    // Step 3: As a last resort, get all users and try to match manually
    userData = await advancedSearch.searchUsersByManualEmailComparison(trimmedEmail);
    
    if (userData) {
      return userData;
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
