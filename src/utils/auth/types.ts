
// Define tipos para objetos de usuário e funções de busca
export type UserRecord = {
  id: string;
  email?: string | null;
  remotejid?: string | null;
  password_hash?: string | null;
  nome?: string | null;
  [key: string]: any; // Permite outras propriedades que podem estar presentes
};
