
// Define tipos para objetos de usuário e funções de busca
export type UserRecord = {
  id: string;
  email: string | null;
  remotejid: string | null;
  password_hash: string | null;
  nome: string | null;
  status_assinatura_cliente: string | null;
  data_expiracao: string | null;
  created_at: string | null;
  completou_cadastro: boolean | null;
  // Removing any additional properties to prevent recursive type definitions
};
