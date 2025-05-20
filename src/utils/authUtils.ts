import { supabase } from '@/integrations/supabase/client';

// Check if a user exists by their remotejid
export const checkUserByRemoteJid = async (remotejid: string) => {
  // Clean the input and log for debugging
  const trimmedRemotejid = remotejid.trim();
  console.log("[AUTH] Looking for user with remotejid:", trimmedRemotejid);
  
  try {
    // Get all users directly from the DB (bypass filtering which seems to be problematic)
    const { data: allUsers, error: fetchError } = await supabase
      .from('donna_clientes')
      .select('*')
      .limit(100); // Set a reasonable limit
    
    if (fetchError) {
      console.error("[AUTH] Error fetching users:", fetchError);
      throw new Error(`Erro ao acessar banco de dados: ${fetchError.message}`);
    }
    
    console.log("[AUTH] Retrieved user count:", allUsers?.length || 0);
    
    // Manual matching - more reliable than Supabase filtering
    if (allUsers && allUsers.length > 0) {
      // Find exact match on trimmed values
      const matchingUser = allUsers.find(user => 
        user.remotejid && user.remotejid.trim() === trimmedRemotejid
      );
      
      if (matchingUser) {
        console.log("[AUTH] Found exact matching user:", matchingUser.id);
        return matchingUser;
      }
      
      // Log detailed debugging info about all users
      console.log("[AUTH] No exact match found. Available users:");
      allUsers.forEach(user => {
        if (user.remotejid) {
          console.log(`[AUTH] User ${user.id}: remotejid="${user.remotejid}"`, 
                    "Length:", user.remotejid.length, 
                    "Value:", user.remotejid,
                    "Trimmed:", user.remotejid.trim(),
                    "Char codes:", Array.from(user.remotejid).map(c => c.charCodeAt(0)));
        }
      });
    } else {
      console.log("[AUTH] No users found in database");
    }
    
    // If we got here, no matching user was found
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

// Create a new password for the user
export const createUserPassword = async (userId: string, password: string) => {
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
