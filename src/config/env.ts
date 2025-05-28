// src/config/env.ts
import { z } from 'zod';

// Esquema de validação para as variáveis de ambiente
const envSchema = z.object({
  // Ambiente
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Aplicação
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default('sua_url_do_supabase'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default('sua_chave_anonima'),
  
  // Autenticação
  SESSION_SECRET: z.string().default('sua_chave_secreta_muito_longa_aqui_123'),
  JWT_SECRET: z.string().default('outra_chave_secreta_muito_longa_123'),
  
  // Banco de Dados
  DATABASE_URL: z.string().url().default('sua_url_do_banco_de_dados'),
});

// Valida as variáveis de ambiente
const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error('❌ Variáveis de ambiente inválidas:', JSON.stringify(env.error.format(), null, 2));
  throw new Error('Configuração de ambiente inválida');
}

// Exporta as configurações validadas
export const config = {
  // Ambiente
  isProduction: env.data.NODE_ENV === 'production',
  isDevelopment: env.data.NODE_ENV === 'development',
  
  // Aplicação
  appUrl: env.data.NEXT_PUBLIC_APP_URL,
  
  // Supabase
  supabase: {
    url: env.data.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // Autenticação
  auth: {
    sessionSecret: env.data.SESSION_SECRET,
    jwtSecret: env.data.JWT_SECRET,
  },
  
  // Banco de Dados
  database: {
    url: env.data.DATABASE_URL,
  },
};

// Tipagem para TypeScript
declare global {
  // Estendendo o tipo ProcessEnv do NodeJS
  interface ProcessEnv extends z.infer<typeof envSchema> {}
}

export default config;
