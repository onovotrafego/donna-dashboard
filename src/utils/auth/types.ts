
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
  // Instead of an index signature that allows any property, we'll explicitly list common additional properties
  // This prevents the excessive type instantiation depth error
  [key: string]: string | boolean | null;
};
