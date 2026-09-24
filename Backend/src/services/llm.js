import OpenAI from 'openai';
import { env } from '../config/env.js';

const PRESETS = {
  gemini:     { baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' },
  openrouter: { baseURL: 'https://openrouter.ai/api/v1' },
  groq:       { baseURL: 'https://api.groq.com/openai/v1' },
  ollama:     { baseURL: 'http://localhost:11434/v1', apiKey: 'ollama' },
};

export function createLlmClient({ provider, baseURL, apiKey }) {
  const preset = PRESETS[provider] ?? {};
  const defaultHeaders = provider === 'openrouter' ? {
    'HTTP-Referer': 'https://github.com/Archin8/codeacious',
    'X-Title': 'Personalized AI Journal',
  } : undefined;

  return new OpenAI({
    baseURL: baseURL || preset.baseURL,
    apiKey: apiKey || preset.apiKey || 'not-needed',
    defaultHeaders,
    timeout: 30_000,
    maxRetries: 2,
  });
}

const client = createLlmClient({
  provider: env.LLM_PROVIDER,
  baseURL: env.LLM_BASE_URL,
  apiKey: env.LLM_API_KEY,
});

export function chat({ messages, stream = false, signal }) {
  return client.chat.completions.create(
    { model: env.LLM_MODEL, messages, temperature: 0.2, stream },
    { signal },
  );
}
