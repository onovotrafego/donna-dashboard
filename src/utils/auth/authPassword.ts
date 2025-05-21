
import { supabase, debugSupabaseQuery } from '@/integrations/supabase/client';
import * as bcrypt from 'bcryptjs-react';

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
