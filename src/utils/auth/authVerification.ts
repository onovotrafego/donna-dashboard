
import { supabase } from '@/integrations/supabase/client';
import * as exactSearch from './exactSearch';
import * as advancedSearch from './advancedSearch';
import * as debugSearch from './debugSearch';
import * as remotejidFormatter from './remotejidFormatter';
import { logger } from '@/utils/security/secureLogger';

// Função para ofuscar IDs sensíveis
const getObfuscatedId = (id: string | null | undefined): string => {
  if (!id) return 'unknown';
  if (id.length <= 8) return '***' + id.slice(-4);
  return id.slice(0, 4) + '...' + id.slice(-4);
};

// Improved function to check if a user exists by remotejid
export const checkUserByRemoteJid = async (remotejid: string) => {
  if (!remotejid || remotejid.trim() === '') {
    logger.error("Empty remotejid provided", new Error('ID de usuário não fornecido'), {
      tags: ['auth', 'verification', 'error']
    });
    throw new Error('ID de usuário não fornecido');
  }
  
  // Normalize remotejid by trimming
  const trimmedRemotejid = remotejid.trim();
  // Create normalized version with + prefix
  const normalizedRemotejid = remotejidFormatter.normalizeRemotejid(trimmedRemotejid);
  
  logger.debug("Looking for user with remotejid", {
    remotejid: getObfuscatedId(trimmedRemotejid),
    normalizedRemotejid: getObfuscatedId(normalizedRemotejid),
    tags: ['auth', 'verification']
  });
  
  try {
    // Step 1: Try exact match with original input
    logger.debug("Trying exact match for original remotejid", {
      remotejid: getObfuscatedId(trimmedRemotejid),
      tags: ['auth', 'verification']
    });
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
      logger.debug("Trying without + prefix", {
        remotejid: getObfuscatedId(withoutPlusRemotejid),
        tags: ['auth', 'verification']
      });
      
      userData = await exactSearch.searchUserByAlternativeFormat(trimmedRemotejid, withoutPlusRemotejid);
      
      if (userData) {
        return userData;
      }
    }
    
    // Step 4: As a last resort, try a broader search with LIKE
    logger.debug("No exact matches found, trying LIKE search with both formats", {
      tags: ['auth', 'verification']
    });
    
    // Create an array of possible formats to search
    const searchFormats = remotejidFormatter.generateSearchFormats(trimmedRemotejid);
    
    userData = await advancedSearch.searchUserByLikeRemoteJid(searchFormats);
    
    if (userData) {
      return userData;
    }
    
    // If we get here, no user was found after exhausting all search options
    logger.warn("No user found with remotejid after trying all formats", {
      requestedRemotejid: getObfuscatedId(trimmedRemotejid),
      normalizedRemotejid: getObfuscatedId(normalizedRemotejid),
      tags: ['auth', 'verification', 'warning']
    });
    
    // Debug: Log all users and their remotejids for debugging
    await debugSearch.getDebugUserList();
    
    throw new Error('Usuário não encontrado');
  } catch (error) {
    if (error.message === 'Usuário não encontrado') {
      throw error;
    }
    logger.error("Error in checkUserByRemoteJid", error as Error, {
      remotejid: getObfuscatedId(trimmedRemotejid),
      tags: ['auth', 'verification', 'error']
    });
    throw new Error(`Erro ao verificar usuário: ${error.message}`);
  }
};

// Simplified function to check if a user exists by email
export const checkUserByEmail = async (email: string) => {
  if (!email || email.trim() === '') {
    logger.error("Empty email provided", new Error('Email não fornecido'), {
      tags: ['auth', 'verification', 'error']
    });
    throw new Error('Email não fornecido');
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  logger.debug("Looking for user with email", {
    email: trimmedEmail.substring(0, 3) + '***' + (trimmedEmail.includes('@') ? trimmedEmail.substring(trimmedEmail.indexOf('@')) : ''),
    tags: ['auth', 'verification']
  });
  
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
    logger.warn("No user found with email", {
      email: trimmedEmail.substring(0, 3) + '***' + (trimmedEmail.includes('@') ? trimmedEmail.substring(trimmedEmail.indexOf('@')) : ''),
      tags: ['auth', 'verification', 'warning']
    });
    throw new Error('Email não encontrado');
  } catch (error) {
    if (error.message === 'Email não encontrado') {
      throw error;
    }
    logger.error("Error in checkUserByEmail", error as Error, {
      email: trimmedEmail.substring(0, 3) + '***',
      tags: ['auth', 'verification', 'error']
    });
    throw new Error(`Erro ao verificar email: ${error.message}`);
  }
};
