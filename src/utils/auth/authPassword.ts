
import { supabase, debugSupabaseQuery } from '@/integrations/supabase/client';
import * as bcrypt from 'bcryptjs-react';
import { logger } from '@/utils/security/secureLogger';

// Função para ofuscar IDs sensíveis
const getObfuscatedId = (id: string | null | undefined): string => {
  if (!id) return 'unknown';
  if (id.length <= 8) return '***' + id.slice(-4);
  return id.slice(0, 4) + '...' + id.slice(-4);
};

// Create a new password for the user (with hashing)
export const createUserPassword = async (userId: string, password: string) => {
  if (!userId || !password) {
    logger.error("Missing userId or password", new Error('Dados incompletos para criar senha'), {
      tags: ['auth', 'password', 'error']
    });
    throw new Error('Dados incompletos para criar senha');
  }
  
  logger.debug("Creating password for user", {
    userId: getObfuscatedId(userId),
    tags: ['auth', 'password']
  });
  
  try {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);
    logger.debug("Password hashed successfully", {
      userId: getObfuscatedId(userId),
      tags: ['auth', 'password']
    });
    
    // Executar a query e obter o resultado
    const query = supabase
      .from('donna_clientes')
      .update({ 
        password_hash: hashedPassword, 
        completou_cadastro: true 
      })
      .eq('id', userId);
    
    const queryResult = await query;
    
    // Usar o debugSupabaseQuery para registrar a execução
    await debugSupabaseQuery(
      Promise.resolve({
        data: queryResult.data,
        error: queryResult.error
      }),
      'createUserPassword - update user'
    );
    
    if (queryResult.error) {
      logger.error("Error updating password", queryResult.error, {
        userId: getObfuscatedId(userId),
        errorCode: queryResult.error.code,
        tags: ['auth', 'password', 'error']
      });
      throw new Error('Não foi possível definir sua senha');
    }
    
    logger.debug("Password created successfully", {
      userId: getObfuscatedId(userId),
      tags: ['auth', 'password']
    });
  } catch (error) {
    logger.error("Error in createUserPassword", error as Error, {
      userId: getObfuscatedId(userId),
      tags: ['auth', 'password', 'error']
    });
    throw new Error(`Erro ao criar senha: ${error.message}`);
  }
};

// Login function with password comparison
export const loginWithPassword = async (userId: string, password: string, storedPasswordHash: string) => {
  if (!userId || !password) {
    logger.error("Missing userId or password for login", new Error('Dados incompletos para login'), {
      tags: ['auth', 'login', 'error']
    });
    return false;
  }
  
  logger.debug("Attempting login for user", {
    userId: getObfuscatedId(userId),
    tags: ['auth', 'login']
  });
  
  try {
    // Make sure we have a password hash to compare against
    if (!storedPasswordHash) {
      logger.error("No stored password hash for user", new Error('Usuário sem senha definida'), {
        userId: getObfuscatedId(userId),
        tags: ['auth', 'login', 'error']
      });
      return false;
    }
    
    // Check if it's a bcrypt hash
    if (storedPasswordHash.startsWith('$2a$') || 
        storedPasswordHash.startsWith('$2b$') || 
        storedPasswordHash.startsWith('$2y$')) {
      // It's a bcrypt hash, compare with bcrypt
      logger.debug("Using bcrypt to compare passwords", {
        userId: getObfuscatedId(userId),
        tags: ['auth', 'login']
      });
      const isMatch = await bcrypt.compare(password, storedPasswordHash);
      
      if (isMatch) {
        logger.debug("Login successful with bcrypt password match", {
          userId: getObfuscatedId(userId),
          tags: ['auth', 'login', 'success']
        });
        return true;
      } else {
        logger.debug("Login failed - password mismatch with bcrypt", {
          userId: getObfuscatedId(userId),
          tags: ['auth', 'login', 'failure']
        });
        return false;
      }
    } else {
      // Legacy case: direct comparison (not recommended)
      logger.debug("Using direct comparison (legacy) for passwords", {
        userId: getObfuscatedId(userId),
        tags: ['auth', 'login']
      });
      if (password === storedPasswordHash) {
        logger.debug("Login successful with direct password match (legacy)", {
          userId: getObfuscatedId(userId),
          tags: ['auth', 'login', 'success']
        });
        return true;
      } else {
        logger.debug("Login failed - password mismatch with direct comparison", {
          userId: getObfuscatedId(userId),
          tags: ['auth', 'login', 'failure']
        });
        return false;
      }
    }
    
    // If we get here, the login failed
    return false;
  } catch (error) {
    logger.error("Error comparing passwords", error as Error, {
      userId: getObfuscatedId(userId),
      tags: ['auth', 'login', 'error']
    });
    return false;
  }
};
