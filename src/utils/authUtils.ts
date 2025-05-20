import { supabase } from '@/integrations/supabase/client';

// Check if a user exists by their remotejid using LIKE query
export const checkUserByRemoteJid = async (remotejid: string) => {
  // Clean the input and log for debugging
  const trimmedRemotejid = remotejid.trim();
  console.log("[AUTH] Looking for user with remotejid:", trimmedRemotejid);
  
  try {
    // Use LIKE query to find matching users (more flexible than exact match)
    const { data: matchingUsers, error: fetchError } = await supabase
      .from('donna_clientes')
      .select('*')
      .ilike('remotejid', `%${trimmedRemotejid}%`)
      .limit(10); // Set a reasonable limit
    
    if (fetchError) {
      console.error("[AUTH] Error fetching users:", fetchError);
      throw new Error(`Erro ao acessar banco de dados: ${fetchError.message}`);
    }
    
    console.log("[AUTH] Retrieved user count using LIKE query:", matchingUsers?.length || 0);
    
    // Check if we found any matching users
    if (matchingUsers && matchingUsers.length > 0) {
      // Find closest match - ideally an exact match if available
      const exactMatch = matchingUsers.find(user => 
        user.remotejid && user.remotejid.trim() === trimmedRemotejid
      );
      
      // If we have an exact match, use it; otherwise use the first match
      const bestMatch = exactMatch || matchingUsers[0];
      
      console.log("[AUTH] Found matching user:", bestMatch.id);
      return bestMatch;
    }
    
    console.log("[AUTH] No matching users found with LIKE query");
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
