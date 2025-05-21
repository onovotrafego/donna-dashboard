
// Re-export de todas as funções de busca de usuário
import { UserRecord } from './types';
import { searchUserByExactRemoteJid, searchUserByAlternativeFormat, searchUserByExactEmail, searchUserByInsensitiveEmail } from './exactSearch';
import { searchUserByLikeRemoteJid, searchUsersByManualEmailComparison } from './advancedSearch';
import { getDebugUserList } from './debugSearch';

// Exportando tipos e funções
export { UserRecord };
export {
  // Funções de busca exata
  searchUserByExactRemoteJid,
  searchUserByAlternativeFormat,
  searchUserByExactEmail,
  searchUserByInsensitiveEmail,
  
  // Funções de busca avançada
  searchUserByLikeRemoteJid,
  searchUsersByManualEmailComparison,
  
  // Funções de debug
  getDebugUserList
};
