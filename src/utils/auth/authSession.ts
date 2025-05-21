
import { supabase } from '@/integrations/supabase/client';

// Custom event name for authentication state changes
export const AUTH_STATE_CHANGE_EVENT = 'auth_state_change';

// Dispatches a custom event to notify components about auth state changes
export const notifyAuthStateChange = () => {
  const event = new CustomEvent(AUTH_STATE_CHANGE_EVENT, {
    detail: { authenticated: true, timestamp: Date.now() }
  });
  window.dispatchEvent(event);
};

// Set user session data in browser storage and create auth token
export const setSessionData = async (userId: string, userName: string) => {
  if (!userId) {
    console.error("[AUTH] Missing userId when setting session data");
    throw new Error('ID de usuário não fornecido para criar sessão');
  }
  
  console.log("[AUTH] Setting session data for user:", userId, userName);
  
  try {
    // Use local storage to store user information regardless of Supabase auth result
    localStorage.setItem('user_id', userId);
    localStorage.setItem('user_name', userName || 'Usuário');
    
    console.log("[AUTH] Session data set successfully");
    
    // Notify all components that auth state changed
    notifyAuthStateChange();
  } catch (error) {
    console.error("[AUTH] Error setting session data:", error);
    throw new Error('Erro ao configurar sessão do usuário');
  }
};

// Clear session data
export const clearSessionData = async () => {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
  } catch (error) {
    console.error("[AUTH] Error during Supabase signout:", error);
  }
  
  // Also clear local storage items
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_expires_at');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_name');
  
  // Notify all components that auth state changed
  notifyAuthStateChange();
};
