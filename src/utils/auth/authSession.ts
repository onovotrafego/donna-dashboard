
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/security/secureLogger';

// Função para ofuscar IDs sensíveis
const getObfuscatedId = (id: string | null | undefined): string => {
  if (!id) return 'unknown';
  if (id.length <= 8) return '***' + id.slice(-4);
  return id.slice(0, 4) + '...' + id.slice(-4);
};

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
    const errorMessage = 'Missing userId when setting session data';
    logger.error(errorMessage, new Error('ID de usuário não fornecido para criar sessão'), {
      tags: ['auth', 'session', 'error']
    });
    throw new Error('ID de usuário não fornecido para criar sessão');
  }
  
  logger.debug("Setting session data for user", {
    userId: getObfuscatedId(userId),
    userName: userName.substring(0, 1) + '***',
    tags: ['auth', 'session']
  });
  
  try {
    // Use local storage to store user information regardless of Supabase auth result
    localStorage.setItem('user_id', userId);
    localStorage.setItem('user_name', userName || 'Usuário');
    
    // Importante: Autenticar o usuário no Supabase para que as políticas RLS funcionem
    try {
      // Primeiro, verifique se o usuário já está autenticado no Supabase
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      
      if (!supabaseUser) {
        logger.debug("Usuário não autenticado no Supabase, criando sessão", {
          tags: ['auth', 'supabase']
        });
        
        // Criar um email baseado no ID do usuário
        const email = `${userId}@finflow.app`;
        
        // Tente fazer login primeiro (caso o usuário já exista)
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: userId // Usando o ID como senha para autenticação
        });
        
        if (error) {
          logger.debug("Erro ao fazer login, tentando registrar usuário", {
            errorMessage: error.message,
            tags: ['auth', 'supabase']
          });
          
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
            logger.error("Erro ao registrar usuário no Supabase", signUpError as Error, {
              userId: getObfuscatedId(userId),
              tags: ['auth', 'supabase', 'error']
            });
            
            // Tentar um método alternativo: login anônimo
            const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
            
            if (anonError) {
              logger.error("Erro ao fazer login anônimo", anonError as Error, {
                tags: ['auth', 'supabase', 'error']
              });
            } else {
              logger.debug("Login anônimo bem-sucedido, atualizando metadados", {
                tags: ['auth', 'supabase']
              });
              
              // Atualizar os metadados do usuário anônimo
              const { error: updateError } = await supabase.auth.updateUser({
                data: {
                  full_name: userName,
                  client_id: userId,
                  user_role: 'client'
                }
              });
              
              if (updateError) {
                logger.error("Erro ao atualizar metadados do usuário anônimo", updateError as Error, {
                  tags: ['auth', 'supabase', 'error']
                });
              } else {
                logger.debug("Metadados do usuário anônimo atualizados com sucesso", {
                  tags: ['auth', 'supabase']
                });
              }
            }
          } else {
            logger.debug("Usuário registrado com sucesso no Supabase", {
              tags: ['auth', 'supabase']
            });
          }
        } else {
          logger.debug("Usuário autenticado com sucesso no Supabase", {
            userId: getObfuscatedId(data?.user?.id),
            tags: ['auth', 'supabase']
          });
          
          // Atualizar os metadados do usuário para garantir que o client_id esteja lá
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              full_name: userName,
              client_id: userId,
              user_role: 'client'
            }
          });
          
          if (updateError) {
            logger.error("Erro ao atualizar metadados do usuário", updateError as Error, {
              userId: getObfuscatedId(userId),
              tags: ['auth', 'supabase', 'error']
            });
          } else {
            logger.debug("Metadados do usuário atualizados com sucesso", {
              userId: getObfuscatedId(userId),
              tags: ['auth', 'supabase']
            });
          }
        }
      } else {
        logger.debug("Usuário já autenticado no Supabase", {
          userId: getObfuscatedId(supabaseUser.id),
          tags: ['auth', 'supabase']
        });
        
        // Verificar se o client_id está nos metadados e atualizar se necessário
        const userMeta = supabaseUser.user_metadata || {};
        if (!userMeta.client_id || userMeta.client_id !== userId) {
          logger.debug("Atualizando metadados do usuário para incluir client_id", {
            userId: getObfuscatedId(supabaseUser.id),
            clientId: getObfuscatedId(userId),
            tags: ['auth', 'supabase']
          });
          
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              ...userMeta,
              full_name: userName,
              client_id: userId,
              user_role: 'client'
            }
          });
          
          if (updateError) {
            logger.error("Erro ao atualizar metadados do usuário", updateError as Error, {
              userId: getObfuscatedId(userId),
              tags: ['auth', 'supabase', 'error']
            });
          } else {
            logger.debug("Metadados do usuário atualizados com sucesso", {
              userId: getObfuscatedId(userId),
              tags: ['auth', 'supabase']
            });
            
            // Recarregar a sessão para garantir que os metadados sejam atualizados
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              logger.error("Erro ao atualizar sessão", refreshError as Error, {
                userId: getObfuscatedId(supabaseUser.id),
                tags: ['auth', 'supabase', 'error']
              });
            } else {
              logger.debug("Sessão atualizada com sucesso", {
                userId: getObfuscatedId(supabaseUser.id),
                tags: ['auth', 'supabase']
              });
            }
          }
        }
      }
    } catch (authError) {
      logger.error("Erro ao autenticar no Supabase", authError as Error, {
        userId: getObfuscatedId(userId),
        tags: ['auth', 'supabase', 'error']
      });
      // Continuar mesmo se houver erro na autenticação do Supabase
    }
    
    logger.debug("Session data set successfully", {
      userId: getObfuscatedId(userId),
      tags: ['auth', 'session']
    });
    
    // Notify all components that auth state changed
    notifyAuthStateChange();
  } catch (error) {
    logger.error("Error setting session data", error as Error, {
      userId: getObfuscatedId(userId),
      tags: ['auth', 'session', 'error']
    });
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
