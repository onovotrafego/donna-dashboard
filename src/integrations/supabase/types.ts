export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      donna_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      donna_clientes: {
        Row: {
          completou_cadastro: boolean | null
          created_at: string | null
          data_expiracao: string
          email: string | null
          id: string
          nome: string | null
          remotejid: string
          status_assinatura_cliente: string
        }
        Insert: {
          completou_cadastro?: boolean | null
          created_at?: string | null
          data_expiracao?: string
          email?: string | null
          id?: string
          nome?: string | null
          remotejid: string
          status_assinatura_cliente?: string
        }
        Update: {
          completou_cadastro?: boolean | null
          created_at?: string | null
          data_expiracao?: string
          email?: string | null
          id?: string
          nome?: string | null
          remotejid?: string
          status_assinatura_cliente?: string
        }
        Relationships: []
      }
      donna_despesas_projetadas: {
        Row: {
          classificacao: string | null
          client_id: string
          created_at: string
          id: number
          tipo_despesa: string | null
          valor: string | null
        }
        Insert: {
          classificacao?: string | null
          client_id: string
          created_at?: string
          id?: number
          tipo_despesa?: string | null
          valor?: string | null
        }
        Update: {
          classificacao?: string | null
          client_id?: string
          created_at?: string
          id?: number
          tipo_despesa?: string | null
          valor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_donna_despesas_projetadas_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "donna_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      donna_entradas_projetadas: {
        Row: {
          ano: string
          client_id: string
          created_at: string
          descricao_entradas: string | null
          id: number
          responsavel: string | null
          valor_entradas: string | null
        }
        Insert: {
          ano: string
          client_id: string
          created_at?: string
          descricao_entradas?: string | null
          id?: number
          responsavel?: string | null
          valor_entradas?: string | null
        }
        Update: {
          ano?: string
          client_id?: string
          created_at?: string
          descricao_entradas?: string | null
          id?: number
          responsavel?: string | null
          valor_entradas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_donna_entradas_projetadas_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "donna_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      donna_indicadores: {
        Row: {
          client_id: string
          created_at: string
          date_atualizacao: string | null
          descricao: string | null
          id: number
          valor_atual: string | null
          valor_projetado: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          date_atualizacao?: string | null
          descricao?: string | null
          id?: number
          valor_atual?: string | null
          valor_projetado?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          date_atualizacao?: string | null
          descricao?: string | null
          id?: number
          valor_atual?: string | null
          valor_projetado?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_donna_indicadores_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "donna_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      donna_lancamentos: {
        Row: {
          ano: string | null
          classificacao: string | null
          client_id: string
          created_at: string
          descricao: string | null
          id: number
          mes: string | null
          natureza: string | null
          responsavel: string | null
          valor: string | null
        }
        Insert: {
          ano?: string | null
          classificacao?: string | null
          client_id: string
          created_at?: string
          descricao?: string | null
          id?: number
          mes?: string | null
          natureza?: string | null
          responsavel?: string | null
          valor?: string | null
        }
        Update: {
          ano?: string | null
          classificacao?: string | null
          client_id?: string
          created_at?: string
          descricao?: string | null
          id?: number
          mes?: string | null
          natureza?: string | null
          responsavel?: string | null
          valor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_donna_lancamentos_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "donna_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      donna_lembretes: {
        Row: {
          client_id: string
          created_at: string
          id: number
          is_enviado: boolean
          lembrete_data: string
          mensagem_lembrete: string
          recorrencia: boolean | null
          valor: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: number
          is_enviado?: boolean
          lembrete_data: string
          mensagem_lembrete: string
          recorrencia?: boolean | null
          valor?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: number
          is_enviado?: boolean
          lembrete_data?: string
          mensagem_lembrete?: string
          recorrencia?: boolean | null
          valor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donna_lembretes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "donna_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      verificar_trial: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
