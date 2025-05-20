
import { supabase } from '@/integrations/supabase/client';

// Check if a user exists by their remotejid
export const checkUserByRemoteJid = async (remotejid: string) => {
  console.log("Checking remotejid before trim:", remotejid);
  const trimmedRemotejid = remotejid.trim();
  console.log("Checking remotejid after trim:", trimmedRemotejid);
  console.log("Remotejid length:", trimmedRemotejid.length);
  console.log("Character codes:", Array.from(trimmedRemotejid).map(c => c.charCodeAt(0)));
  
  const { data, error } = await supabase
    .from('donna_clientes')
    .select('*')
    .eq('remotejid', trimmedRemotejid)
    .maybeSingle();
  
  console.log("Query result:", data, error);
  
  if (error) {
    console.error("Error details:", error);
    throw new Error('Erro ao verificar usuário');
  }
  
  if (!data) {
    console.log("No user found with remotejid:", trimmedRemotejid);
    
    // Get some users from DB for debugging
    const { data: allUsers, error: listError } = await supabase
      .from('donna_clientes')
      .select('remotejid')
      .limit(10);
    
    console.log("Available users in DB:", allUsers, listError);
    throw new Error('Usuário não encontrado');
  }
  
  return data;
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
  sessionStorage.setItem('user_id', userId);
  sessionStorage.setItem('user_name', userName || 'Usuário');
};
