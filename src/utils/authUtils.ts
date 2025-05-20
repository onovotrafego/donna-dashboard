import { supabase } from '@/integrations/supabase/client';

// Check if a user exists by their remotejid
export const checkUserByRemoteJid = async (remotejid: string) => {
  console.log("Checking remotejid before trim:", remotejid);
  const trimmedRemotejid = remotejid.trim();
  console.log("Checking remotejid after trim:", trimmedRemotejid);
  console.log("Remotejid length:", trimmedRemotejid.length);
  console.log("Character codes:", Array.from(trimmedRemotejid).map(c => c.charCodeAt(0)));
  
  try {
    // First attempt - using ilike for more forgiving matching
    const { data, error } = await supabase
      .from('donna_clientes')
      .select('*')
      .ilike('remotejid', trimmedRemotejid)
      .maybeSingle();
    
    console.log("ilike query result:", data, error);
    
    if (data) {
      return data;
    }
    
    // Second attempt - using direct equality if ilike fails
    const { data: exactData, error: exactError } = await supabase
      .from('donna_clientes')
      .select('*')
      .eq('remotejid', trimmedRemotejid)
      .maybeSingle();
    
    console.log("eq query result:", exactData, exactError);
    
    if (exactData) {
      return exactData;
    }
    
    // Third attempt - try without any filtering to see all available users
    const { data: allUsers, error: listError } = await supabase
      .from('donna_clientes')
      .select('remotejid, id')
      .limit(10);
    
    console.log("All available users in DB:", allUsers);
    console.log("All users query error:", listError);
    
    if (listError) {
      console.error("Error fetching all users:", listError);
      throw new Error(`Erro ao acessar banco de dados: ${listError.message}`);
    }
    
    // Try a raw query to see if there's any matching remotejid
    if (allUsers && allUsers.length > 0) {
      const matchingUser = allUsers.find(user => 
        user.remotejid && user.remotejid.trim() === trimmedRemotejid
      );
      
      if (matchingUser) {
        console.log("Found matching user through manual check:", matchingUser);
        
        // Fetch the full user data with the found ID
        const { data: userData, error: userError } = await supabase
          .from('donna_clientes')
          .select('*')
          .eq('id', matchingUser.id)
          .single();
          
        if (userData) {
          return userData;
        }
      }
      
      console.log("No manually matching user found in:", allUsers);
      console.log("Looking for:", trimmedRemotejid);
      
      // Log each user's remotejid details for debugging
      allUsers.forEach(user => {
        if (user.remotejid) {
          console.log(`User ${user.id} remotejid: "${user.remotejid}"`, 
                      "Length:", user.remotejid.length, 
                      "Char codes:", Array.from(user.remotejid).map(c => c.charCodeAt(0)));
        }
      });
    }
    
    // If we got here, no user was found
    throw new Error('Usuário não encontrado');
  } catch (error: any) {
    console.error("Error details:", error);
    
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
  // Clear any existing session data first
  sessionStorage.clear();
  
  // Set new session data
  sessionStorage.setItem('user_id', userId);
  sessionStorage.setItem('user_name', userName || 'Usuário');
};
