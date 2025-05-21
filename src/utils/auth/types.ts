
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
  // Remove the recursive index signature that causes the TS2589 error
  // and explicitly define any additional properties if needed
};
