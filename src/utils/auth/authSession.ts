
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/security/secureLogger';

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
        console.log("[AUTH] Usuário não autenticado no Supabase, criando sessão");
        
        // Criar um email baseado no ID do usuário
        const email = `${userId}@finflow.app`;
        
        // Tente fazer login primeiro (caso o usuário já exista)
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: userId // Usando o ID como senha para autenticação
        });
        
        if (error) {
          console.log("[AUTH] Erro ao fazer login, tentando registrar usuário:", error.message);
          
          // Se falhar o login, tente registrar o usuário
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: userId,
            options: {
              data: {
                full_name: userName,
                client_id: userId,
                user_role: 'client'
              }
            }
          });
          
          if (signUpError) {
            console.error("[AUTH] Erro ao registrar usuário no Supabase:", signUpError);
            
            // Tentar um método alternativo: login anônimo
            const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
            
            if (anonError) {
              console.error("[AUTH] Erro ao fazer login anônimo:", anonError);
            } else {
              console.log("[AUTH] Login anônimo bem-sucedido, atualizando metadados");
              
              // Atualizar os metadados do usuário anônimo
              const { error: updateError } = await supabase.auth.updateUser({
                data: {
                  full_name: userName,
                  client_id: userId,
                  user_role: 'client'
                }
              });
              
              if (updateError) {
                console.error("[AUTH] Erro ao atualizar metadados do usuário anônimo:", updateError);
              } else {
                console.log("[AUTH] Metadados do usuário anônimo atualizados com sucesso");
              }
            }
          } else {
            console.log("[AUTH] Usuário registrado com sucesso no Supabase");
          }
        } else {
          console.log("[AUTH] Usuário autenticado com sucesso no Supabase:", data?.user?.id);
          
          // Atualizar os metadados do usuário para garantir que o client_id esteja lá
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              full_name: userName,
              client_id: userId,
              user_role: 'client'
            }
          });
          
          if (updateError) {
            console.error("[AUTH] Erro ao atualizar metadados do usuário:", updateError);
          } else {
            console.log("[AUTH] Metadados do usuário atualizados com sucesso");
          }
        }
      } else {
        console.log("[AUTH] Usuário já autenticado no Supabase:", supabaseUser.id);
        
        // Verificar se o client_id está nos metadados e atualizar se necessário
        const userMeta = supabaseUser.user_metadata || {};
        if (!userMeta.client_id || userMeta.client_id !== userId) {
          console.log("[AUTH] Atualizando metadados do usuário para incluir client_id");
          
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              ...userMeta,
              full_name: userName,
              client_id: userId,
              user_role: 'client'
            }
          });
          
          if (updateError) {
            console.error("[AUTH] Erro ao atualizar metadados do usuário:", updateError);
          } else {
            console.log("[AUTH] Metadados do usuário atualizados com sucesso");
            
            // Recarregar a sessão para garantir que os metadados sejam atualizados
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              console.error("[AUTH] Erro ao atualizar sessão:", refreshError);
            } else {
              console.log("[AUTH] Sessão atualizada com sucesso");
            }
          }
        }
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

/**
 * Clear session data
 */
export const clearSessionData = async () => {
  try {
    logger.info('Iniciando processo de logout', {
      tags: ['auth', 'logout']
    });
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear secure session data
    try {
      // Se você tiver um serviço de sessão seguro, limpe aqui
      // Ex: await secureSessionService.clearSession();
    } catch (sessionError) {
      const errorMessage = 'Erro ao limpar sessão segura: ' + 
        (sessionError instanceof Error ? sessionError.message : String(sessionError));
      logger.error(errorMessage);
    }
    
    // Clear local storage items
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_expires_at');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    
    // Clear session storage
    sessionStorage.clear();
    
    logger.info('Logout concluído com sucesso', {
      tags: ['auth', 'logout', 'success']
    });
    
  } catch (error) {
    const errorMessage = 'Erro durante o logout: ' + 
      (error instanceof Error ? error.message : 'Erro desconhecido');
    logger.error(errorMessage);
    throw error; // Relança o erro para tratamento adicional, se necessário
  } finally {
    // Notify all components that auth state changed
    notifyAuthStateChange();
  }
};
