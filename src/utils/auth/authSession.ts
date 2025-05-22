
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
    
    // Importante: Autenticar o usuário no Supabase para que as políticas RLS funcionem
    try {
      // Primeiro, verifique se o usuário já está autenticado no Supabase
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      
      if (!supabaseUser) {
        console.log("[AUTH] Usuário não autenticado no Supabase, criando sessão anônima");
        // Se não estiver autenticado, crie uma sessão anônima com o ID do cliente
        const { data, error } = await supabase.auth.signInWithPassword({
          email: `${userId}@anonymous.user`,
          password: userId // Usando o ID como senha para autenticação anônima
        });
        
        if (error) {
          // Se falhar o login, tente registrar o usuário
          console.log("[AUTH] Tentando registrar usuário anônimo no Supabase");
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: `${userId}@anonymous.user`,
            password: userId,
            options: {
              data: {
                full_name: userName,
                client_id: userId
              }
            }
          });
          
          if (signUpError) {
            console.error("[AUTH] Erro ao registrar usuário no Supabase:", signUpError);
          } else {
            console.log("[AUTH] Usuário registrado com sucesso no Supabase");
          }
        } else {
          console.log("[AUTH] Usuário autenticado com sucesso no Supabase");
        }
      } else {
        console.log("[AUTH] Usuário já autenticado no Supabase:", supabaseUser.id);
      }
    } catch (authError) {
      console.error("[AUTH] Erro ao autenticar no Supabase:", authError);
      // Continuar mesmo se houver erro na autenticação do Supabase
    }
    
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
