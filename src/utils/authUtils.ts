import { supabase } from '@/integrations/supabase/client';

// Check if a user exists by their remotejid with improved matching
export const checkUserByRemoteJid = async (remotejid: string) => {
  // Clean the input and log for debugging
  const trimmedRemotejid = remotejid.trim();
  console.log("[AUTH] Looking for user with remotejid:", trimmedRemotejid);
  
  try {
    // First try exact match (more efficient)
    let { data: exactUsers, error: exactError } = await supabase
      .from('donna_clientes')
      .select('*')
      .eq('remotejid', trimmedRemotejid);
    
    if (exactError) {
      console.error("[AUTH] Error in exact match query:", exactError);
      throw new Error(`Erro ao acessar banco de dados: ${exactError.message}`);
    }
    
    console.log("[AUTH] Exact match results:", exactUsers?.length || 0);
    
    // If exact match found, return the first result
    if (exactUsers && exactUsers.length > 0) {
      console.log("[AUTH] Found exact matching user:", exactUsers[0].id);
      return exactUsers[0];
    }
    
    // Fall back to LIKE query if no exact match
    const { data: likeUsers, error: likeError } = await supabase
      .from('donna_clientes')
      .select('*')
      .ilike('remotejid', `%${trimmedRemotejid}%`)
      .limit(10);
    
    if (likeError) {
      console.error("[AUTH] Error in LIKE query:", likeError);
      throw new Error(`Erro ao acessar banco de dados: ${likeError.message}`);
    }
    
    console.log("[AUTH] LIKE query results:", likeUsers?.length || 0);
    
    if (likeUsers && likeUsers.length > 0) {
      console.log("[AUTH] Found user via LIKE query:", likeUsers[0].id);
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
  
  // Check for master admin login - Use the specific client ID provided
  if (trimmedEmail === 'adm@adm.com') {
    console.log("[AUTH] Master admin login detected");
    
    // Admin special account
    return {
      id: 'b33cb615-1235-4c5e-9c8d-3c15c2ad8336',
      email: 'adm@adm.com',
      nome: 'Administrador',
      password_hash: 'admin',
      completou_cadastro: true
    };
  }
  
  try {
    // Email should be unique, so we use exact match
    const { data: users, error: fetchError } = await supabase
      .from('donna_clientes')
      .select('*')
      .eq('email', trimmedEmail);
    
    if (fetchError) {
      console.error("[AUTH] Error fetching user by email:", fetchError);
      throw new Error(`Erro ao acessar banco de dados: ${fetchError.message}`);
    }
    
    console.log("[AUTH] Email query results:", users?.length || 0);
    
    if (users && users.length > 0) {
      console.log("[AUTH] Found user with matching email:", users[0].id);
      return users[0];
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

// Create a new password for the user
export const createUserPassword = async (userId: string, password: string) => {
  console.log("[AUTH] Creating password for user:", userId);
  
  // Skip database update for master admin
  if (userId === 'b33cb615-1235-4c5e-9c8d-3c15c2ad8336') {
    console.log("[AUTH] Skipping password creation for admin user");
    return;
  }

  const { error } = await supabase
    .from('donna_clientes')
    .update({ 
      password_hash: password, 
      completou_cadastro: true 
    })
    .eq('id', userId);
  
  if (error) {
    console.error("[AUTH] Error creating password:", error);
    throw new Error('Não foi possível definir sua senha');
  }
  
  console.log("[AUTH] Password created successfully");
};

// Set user session data in browser storage
export const setSessionData = (userId: string, userName: string) => {
  console.log("[AUTH] Setting session data for user:", userId, userName);
  
  // Clear all browser storage to ensure no stale data
  sessionStorage.clear();
  localStorage.clear();
  
  // Set new session data
  sessionStorage.setItem('user_id', userId);
  sessionStorage.setItem('user_name', userName || 'Usuário');
  
  console.log("[AUTH] Session data set successfully");
};

// Custom login function to handle both password authentication
export const loginWithPassword = async (userId: string, password: string, storedPassword: string) => {
  console.log("[AUTH] Attempting login for user:", userId);
  
  // Special case for admin
  if (userId === 'b33cb615-1235-4c5e-9c8d-3c15c2ad8336' && password === 'admin') {
    console.log("[AUTH] Admin login successful");
    return true;
  }
  
  // For normal users, compare with password hash stored in DB
  if (password === storedPassword) {
    console.log("[AUTH] Login successful with password match");
    return true;
  }
  
  console.log("[AUTH] Login failed - password mismatch");
  return false;
};
