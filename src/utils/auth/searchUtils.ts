
import { supabase } from "@/integrations/supabase/client";

/**
 * Verificar IDs de cliente presentes no aplicativo
 * Função de diagnóstico para depuração
 */
export const verifyClientIds = () => {
  const localStorageId = localStorage.getItem('user_id');
  console.log('[UTILS] Client ID no localStorage:', localStorageId);
  
  // Verificar se o ID existe sem referências circulares
  if (localStorageId) {
    console.log('[UTILS] Client ID encontrado no localStorage');
  } else {
    console.log('[UTILS] Nenhum client_id encontrado no localStorage');
  }
};
