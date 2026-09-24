// ─── The ONLY file that reads process.env ───
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV:                 z.enum(['development', 'production', 'test']).default('development'),
  PORT:                     z.coerce.number().int().positive().default(4000),
  CLIENT_URL:               z.string().default('http://localhost:5173'),
  LOG_LEVEL:                z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  SUPABASE_URL:             z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  LLM_PROVIDER:             z.enum(['gemini', 'openrouter', 'ollama', 'groq', 'custom']).default('gemini'),
  LLM_BASE_URL:             z.string().default(''),
  LLM_API_KEY:              z.string().min(1),
  LLM_MODEL:                z.string().min(1).default('gemini-2.5-flash'),

  EMBED_PROVIDER:           z.enum(['gemini', 'openrouter', 'ollama', 'groq', 'custom']).default('gemini'),
  EMBED_BASE_URL:           z.string().default(''),
  EMBED_API_KEY:            z.string().min(1),
  EMBED_MODEL:              z.string().min(1).default('gemini-embedding-001'),
  EMBED_DIMENSIONS:         z.coerce.number().int().positive().default(768),

  RAG_TOP_K:                z.coerce.number().int().positive().default(5),
  RAG_MIN_SIMILARITY:       z.coerce.number().min(0).max(1).default(0.3),
  MAX_NOTE_CHARS:           z.coerce.number().int().positive().default(10000),
  MAX_QUESTION_CHARS:       z.coerce.number().int().positive().default(1000),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('\n❌  Environment validation failed:\n');
  for (const issue of result.error.issues) {
    console.error(`   ${issue.path.join('.')} — ${issue.message}`);
  }
  console.error('\n   Check .env against .env.example\n');
  process.exit(1);
}

export const env = Object.freeze(result.data);
