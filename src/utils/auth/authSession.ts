
import { setAuthToken } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

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
    
    // Notify all components that auth state changed
    notifyAuthStateChange();
  } catch (error) {
    console.error("[AUTH] Error setting session data:", error);
    throw new Error('Erro ao configurar sessão do usuário');
  }
};

// Clear session data
export const clearSessionData = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_expires_at');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_name');
  
  // Notify all components that auth state changed
  notifyAuthStateChange();
};
