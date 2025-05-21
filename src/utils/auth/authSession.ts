
import { setAuthToken } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Set user session data in browser storage and create auth token
export const setSessionData = (userId: string, userName: string) => {
  if (!userId) {
    console.error("[AUTH] Missing userId when setting session data");
    throw new Error('ID de usuário não fornecido para criar sessão');
  }
  
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
