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
        .eq('remotejid', trimmedRemotejid)
        .maybeSingle(),
      'checkUserByRemoteJid - exact match'
    );
    
    if (exactError) {
      console.error("[AUTH] Error in exact match query:", exactError);
      throw new Error(`Erro ao acessar banco de dados: ${exactError.message}`);
    }
    
    console.log("[AUTH] Exact match results:", exactUsers ? "Found" : "Not found");
    if (exactUsers) {
      console.log("[AUTH] Found exact matching user:", exactUsers.id);
      console.log("[AUTH] User data:", JSON.stringify(exactUsers));
      return exactUsers;
    }
    
    // If exact match fails, try case insensitive match
    const { data: allUsers, error: allUsersError } = await debugSupabaseQuery(
      supabase
        .from('donna_clientes')
        .select('*')
        .limit(10),
      'checkUserByRemoteJid - all users sample'
    );
    
    if (allUsersError) {
      console.error("[AUTH] Error fetching sample users:", allUsersError);
    } else {
      console.log("[AUTH] All users in database:", JSON.stringify(allUsers));
      
      if (allUsers && allUsers.length > 0) {
        // Check for close matches manually
        for (const user of allUsers) {
          console.log(`[AUTH] Comparing DB remotejid: "${user.remotejid}" with input: "${trimmedRemotejid}"`);
          
          if (user.remotejid && (
              user.remotejid === trimmedRemotejid || 
              user.remotejid.trim() === trimmedRemotejid ||
              user.remotejid.toLowerCase() === trimmedRemotejid.toLowerCase()
          )) {
            console.log("[AUTH] Found matching user via comparison:", user.id);
            return user;
          }
        }
      } else {
        console.log("[AUTH] No users found in the database");
      }
    }
    
    // Fall back to LIKE query as a last resort
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
  
  // Check for master admin login - Using a unique admin ID that won't conflict
  if (trimmedEmail === 'adm@adm.com') {
    console.log("[AUTH] Master admin login detected");
    
    // Special admin account with unique ID
    return {
      id: 'admin-master-id-98765',
      email: 'adm@adm.com',
      nome: 'Administrador',
      password_hash: await bcrypt.hash('admin', 10),
      completou_cadastro: true
    };
  }
  
  try {
    console.log("[AUTH] Querying database for email:", trimmedEmail);
    
    // First use exact match (case insensitive)
    const { data: users, error: fetchError } = await debugSupabaseQuery(
      supabase
        .from('donna_clientes')
        .select('*')
        .ilike('email', trimmedEmail)
        .maybeSingle(),
      'checkUserByEmail - exact match'
    );
    
    if (fetchError) {
      console.error("[AUTH] Error fetching user by email:", fetchError);
      
      // Check if it's a 406 error (not found or multiple rows)
      if (fetchError.code === 'PGRST116') {
        console.log("[AUTH] Got 406 error - trying different approach");
        
        // Try getting all users and filtering
        const { data: allUsers, error: allUsersError } = await debugSupabaseQuery(
          supabase
            .from('donna_clientes')
            .select('*')
            .limit(20),
          'checkUserByEmail - all users sample'
        );
        
        if (!allUsersError && allUsers && allUsers.length > 0) {
          console.log("[AUTH] Found", allUsers.length, "users in database");
          
          // Find matching email
          for (const user of allUsers) {
            if (user.email && user.email.toLowerCase() === trimmedEmail) {
              console.log("[AUTH] Found matching user:", user.id);
              return user;
            }
          }
        }
      } else {
        throw new Error(`Erro ao acessar banco de dados: ${fetchError.message}`);
      }
    }
    
    if (users) {
      console.log("[AUTH] Found user with matching email:", users.id);
      console.log("[AUTH] User data:", JSON.stringify(users));
      return users;
    }
    
    // If no user found yet, try all users as a last resort
    console.log("[AUTH] No exact match, trying to list all users");
    
    const { data: allUsers, error: allUsersError } = await debugSupabaseQuery(
      supabase
        .from('donna_clientes')
        .select('*')
        .limit(20),
      'checkUserByEmail - all users list'
    );
    
    if (!allUsersError && allUsers && allUsers.length > 0) {
      console.log("[AUTH] Total users found:", allUsers.length);
      console.log("[AUTH] Available emails:", allUsers.map(u => u.email).join(', '));
      
      // Try to find by case-insensitive comparison
      for (const user of allUsers) {
        if (user.email && user.email.toLowerCase() === trimmedEmail) {
          console.log("[AUTH] Found matching user by manual comparison:", user.id);
          return user;
        }
      }
    } else {
      console.log("[AUTH] No users found in database or error:", allUsersError);
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
    if (userId === 'admin-master-id-98765') {
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
    if (userId === 'admin-master-id-98765' && password === 'admin') {
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
