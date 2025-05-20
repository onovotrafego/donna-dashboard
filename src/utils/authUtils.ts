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
    
    // We'll now fetch a real user with the specified ID to view its data
    const ADMIN_REAL_DATA_CLIENT_ID = 'b33cb615-1235-4c5e-9c8d-3c15c2ad8336';
    
    try {
      const { data: realClient, error } = await supabase
        .from('donna_clientes')
        .select('*')
        .eq('id', ADMIN_REAL_DATA_CLIENT_ID)
        .single();
      
      if (error || !realClient) {
        console.error("[AUTH] Error fetching real client data for admin:", error);
        // Fall back to static admin data if real client fetch fails
        return {
          id: ADMIN_REAL_DATA_CLIENT_ID, // Use the real client ID
          email: 'adm@adm.com',
          nome: 'Administrador',
          password_hash: 'admin',
          completou_cadastro: true
        };
      }
      
      console.log("[AUTH] Successfully fetched real client data for admin:", realClient);
      
      // Return the real client data but keep admin credentials for login
      return {
        ...realClient,
        email: 'adm@adm.com',
        nome: 'Administrador',
        password_hash: 'admin'
      };
    } catch (err) {
      console.error("[AUTH] Error in admin data fetch:", err);
      // Fall back to static admin data with real client ID
      return {
        id: ADMIN_REAL_DATA_CLIENT_ID,
        email: 'adm@adm.com',
        nome: 'Administrador',
        password_hash: 'admin',
        completou_cadastro: true
      };
    }
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
    throw new Error('Não foi possível definir sua senha');
  }
};

// Set user session data in browser storage
export const setSessionData = (userId: string, userName: string) => {
  // Clear all browser storage to ensure no stale data
  sessionStorage.clear();
  localStorage.clear();
  
  // Set new session data
  sessionStorage.setItem('user_id', userId);
  sessionStorage.setItem('user_name', userName || 'Usuário');
};
