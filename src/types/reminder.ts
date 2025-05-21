
export interface Reminder {
  id: number;
  client_id: string;
  lembrete_data: string; // Data no formato ISO
  mensagem_lembrete: string;
  is_enviado: boolean;
  recorrencia: boolean | null;
  valor: string | null;
  created_at: string;
}
