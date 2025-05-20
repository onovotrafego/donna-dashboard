
import { supabase, setAuthToken, debugSupabaseQuery } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs-react';

// Check if a user exists by their remotejid with improved matching
export const checkUserByRemoteJid = async (remotejid: string) => {
  // Clean the input and log for debugging
  const trimmedRemotejid = remotejid.trim();
  console.log("[AUTH] Looking for user with remotejid:", trimmedRemotejid);
  console.log("[AUTH] Remotejid type:", typeof trimmedRemotejid, "Length:", trimmedRemotejid.length);
  
  try {
    // First try exact match (more efficient)
    const { data: exactUsers, error: exactError } = await debugSupabaseQuery(
      supabase
        .from('donna_clientes')
        .select('*')
        .eq('remotejid', trimmedRemotejid),
      'checkUserByRemoteJid - exact match'
    );
    
    if (exactError) {
      console.error("[AUTH] Error in exact match query:", exactError);
      throw new Error(`Erro ao acessar banco de dados: ${exactError.message}`);
    }
    
    console.log("[AUTH] Exact match results:", exactUsers?.length || 0);
    if (exactUsers && exactUsers.length > 0) {
      console.log("[AUTH] Found exact matching user:", exactUsers[0].id);
      console.log("[AUTH] User data:", JSON.stringify(exactUsers[0]));
      return exactUsers[0];
    }
    
    // If exact match fails, try without trimming (in case whitespace is actually part of the stored value)
    const { data: exactWithoutTrimUsers, error: exactWithoutTrimError } = await debugSupabaseQuery(
      supabase
        .from('donna_clientes')
        .select('*')
        .eq('remotejid', remotejid),
      'checkUserByRemoteJid - exact without trim match'
    );
    
    if (exactWithoutTrimError) {
      console.error("[AUTH] Error in exact without trim query:", exactWithoutTrimError);
    } else if (exactWithoutTrimUsers && exactWithoutTrimUsers.length > 0) {
      console.log("[AUTH] Found exact matching user without trim:", exactWithoutTrimUsers[0].id);
      console.log("[AUTH] User data:", JSON.stringify(exactWithoutTrimUsers[0]));
      return exactWithoutTrimUsers[0];
    }
    
    // Try direct database query for comparison
    console.log("[AUTH] Attempting direct comparison for troubleshooting");
    const { data: allUsers, error: allUsersError } = await debugSupabaseQuery(
      supabase
        .from('donna_clientes')
        .select('id, remotejid')
        .limit(10),
      'checkUserByRemoteJid - all users sample'
    );
    
    if (allUsersError) {
      console.error("[AUTH] Error fetching sample users:", allUsersError);
    } else {
      console.log("[AUTH] Sample users in database:", JSON.stringify(allUsers));
      
      // Manual comparison for debugging
      for (const user of allUsers || []) {
        console.log(
          `[AUTH] Comparing DB remotejid: "${user.remotejid}" (${typeof user.remotejid}, ${user.remotejid?.length || 0}) with input: "${trimmedRemotejid}" (${typeof trimmedRemotejid}, ${trimmedRemotejid.length})`
        );
        
        if (user.remotejid && (
            user.remotejid === trimmedRemotejid || 
            user.remotejid.trim() === trimmedRemotejid ||
            user.remotejid === remotejid
        )) {
          console.log("[AUTH] Found matching user via manual comparison:", user.id);
          
          // Fetch full user data
          const { data: userData, error: userError } = await debugSupabaseQuery(
            supabase
              .from('donna_clientes')
              .select('*')
              .eq('id', user.id),
            'checkUserByRemoteJid - fetch matched user'
          );
          
          if (userError) {
            console.error("[AUTH] Error fetching matched user:", userError);
          } else if (userData && userData.length > 0) {
            console.log("[AUTH] Returning manually matched user:", userData[0].id);
            return userData[0];
          }
        }
      }
    }
    
    // Fall back to LIKE query as before
    const { data: likeUsers, error: likeError } = await debugSupabaseQuery(
      supabase
        .from('donna_clientes')
        .select('*')
        .ilike('remotejid', `%${trimmedRemotejid}%`)
        .limit(10),
      'checkUserByRemoteJid - LIKE match'
    );
    
    if (likeError) {
      console.error("[AUTH] Error in LIKE query:", likeError);
      throw new Error(`Erro ao acessar banco de dados: ${likeError.message}`);
    }
    
    console.log("[AUTH] LIKE query results:", likeUsers?.length || 0);
    
    if (likeUsers && likeUsers.length > 0) {
      console.log("[AUTH] Found user via LIKE query:", likeUsers[0].id);
      console.log("[AUTH] User data:", JSON.stringify(likeUsers[0]));
      return likeUsers[0];
    }
    
    console.log("[AUTH] No matching users found with any method");
    throw new Error('Usuário não encontrado');
  } catch (error: any) {
    console.error("[AUTH] Error in checkUserByRemoteJid:", error);
    
    // If it's already our custom error, just throw it
    if (error.message === 'Usuário não encontrado') {
      throw error;
    }
    
    // Otherwise wrap it with more details
    throw new Error(`Erro ao verificar usuário: ${error.message}`);
  }
};

// Check user by email with master login support
export const checkUserByEmail = async (email: string) => {
  // Clean the input and log for debugging
  const trimmedEmail = email.trim().toLowerCase();
  console.log("[AUTH] Looking for user with email:", trimmedEmail);
  
  // Check for master admin login - Use a different ID to avoid conflicts
  if (trimmedEmail === 'adm@adm.com') {
    console.log("[AUTH] Master admin login detected");
    
    // Admin special account with different ID to avoid conflicts with real users
    return {
      id: 'admin-special-id-12345',
      email: 'adm@adm.com',
      nome: 'Administrador',
      password_hash: await bcrypt.hash('admin', 10),
      completou_cadastro: true
    };
  }
  
  try {
    // First, log all users in the database for debugging
    const { data: allUsers, error: allUsersError } = await debugSupabaseQuery(
      supabase
        .from('donna_clientes')
        .select('id, email')
        .limit(20),
      'checkUserByEmail - all users sample'
    );
    
    if (!allUsersError) {
      console.log("[AUTH] All users in database:", JSON.stringify(allUsers));
    }
    
    // Email should be unique, so we use exact match
    const { data: users, error: fetchError } = await debugSupabaseQuery(
      supabase
        .from('donna_clientes')
        .select('*')
        .eq('email', trimmedEmail),
      'checkUserByEmail - exact match'
    );
    
    if (fetchError) {
      console.error("[AUTH] Error fetching user by email:", fetchError);
      throw new Error(`Erro ao acessar banco de dados: ${fetchError.message}`);
    }
    
    console.log("[AUTH] Email query results:", users?.length || 0);
    
    if (users && users.length > 0) {
      console.log("[AUTH] Found user with matching email:", users[0].id);
      console.log("[AUTH] User data:", JSON.stringify(users[0]));
      return users[0];
    }
    
    // If exact match fails, try case insensitive match
    const { data: caseInsensitiveUsers, error: caseInsensitiveError } = await debugSupabaseQuery(
      supabase
        .from('donna_clientes')
        .select('*')
        .ilike('email', trimmedEmail),
      'checkUserByEmail - case insensitive match'
    );
    
    if (!caseInsensitiveError && caseInsensitiveUsers && caseInsensitiveUsers.length > 0) {
      console.log("[AUTH] Found user with case insensitive email match:", caseInsensitiveUsers[0].id);
      console.log("[AUTH] User data:", JSON.stringify(caseInsensitiveUsers[0]));
      return caseInsensitiveUsers[0];
    }
    
    console.log("[AUTH] No user found with this email");
    throw new Error('Email não encontrado');
  } catch (error: any) {
    console.error("[AUTH] Error in checkUserByEmail:", error);
    
    // If it's already our custom error, just throw it
    if (error.message === 'Email não encontrado') {
      throw error;
    }
    
    // Otherwise wrap it with more details
    throw new Error(`Erro ao verificar email: ${error.message}`);
  }
};

// Create a new password for the user (with hashing)
export const createUserPassword = async (userId: string, password: string) => {
  console.log("[AUTH] Creating password for user:", userId);
  
  try {
    // Skip database update for master admin
    if (userId === 'admin-special-id-12345') {
      console.log("[AUTH] Skipping password creation for admin user");
      return;
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { error } = await supabase
      .from('donna_clientes')
      .update({ 
        password_hash: hashedPassword, 
        completou_cadastro: true 
      })
      .eq('id', userId);
    
    if (error) {
      console.error("[AUTH] Error creating password:", error);
      throw new Error('Não foi possível definir sua senha');
    }
    
    console.log("[AUTH] Password created successfully");
  } catch (error: any) {
    console.error("[AUTH] Error in createUserPassword:", error);
    throw new Error(`Erro ao criar senha: ${error.message}`);
  }
};

// Set user session data in browser storage and create auth token
export const setSessionData = (userId: string, userName: string) => {
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

// Custom login function with password comparison
export const loginWithPassword = async (userId: string, password: string, storedPasswordHash: string) => {
  console.log("[AUTH] Attempting login for user:", userId);
  
  try {
    // Special case for admin
    if (userId === 'admin-special-id-12345' && password === 'admin') {
      console.log("[AUTH] Admin login successful");
      return true;
    }
    
    // For normal users, compare with bcrypt
    if (storedPasswordHash && (storedPasswordHash.startsWith('$2a$') || storedPasswordHash.startsWith('$2b$') || storedPasswordHash.startsWith('$2y$'))) {
      // It's already hashed, compare with bcrypt
      const isMatch = await bcrypt.compare(password, storedPasswordHash);
      if (isMatch) {
        console.log("[AUTH] Login successful with bcrypt password match");
        return true;
      }
    } else if (storedPasswordHash && password === storedPasswordHash) {
      // Legacy passwords without hashing - direct comparison
      // In a production app, you would want to rehash these on successful login
      console.log("[AUTH] Login successful with plain text password match (legacy)");
      return true;
    }
    
    console.log("[AUTH] Login failed - password mismatch");
    return false;
  } catch (error) {
    console.error("[AUTH] Error comparing passwords:", error);
    return false;
  }
};
