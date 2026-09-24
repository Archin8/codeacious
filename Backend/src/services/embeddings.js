import { createLlmClient } from './llm.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { AppError } from '../utils/errors.js';

const embedClient = createLlmClient({
  provider: env.EMBED_PROVIDER,
  baseURL: env.EMBED_BASE_URL,
  apiKey: env.EMBED_API_KEY,
});

export async function embedTexts(texts) {
  if (!texts || texts.length === 0) return [];

  let response;
  try {
    response = await embedClient.embeddings.create({
      model: env.EMBED_MODEL,
      input: texts,
      dimensions: env.EMBED_DIMENSIONS,
    });
  } catch (err) {
    if (err?.status === 429 || err?.code === 429 || String(err?.message || '').includes('429')) {
      throw new AppError(503, 'embedding_rate_limited', 'Embedding service rate limited');
    }
    throw new AppError(502, 'embedding_failed', 'Embedding generation failed');
  }

  const targetDim = env.EMBED_DIMENSIONS;
  const sortedData = [...response.data].sort((a, b) => a.index - b.index);

  return sortedData.map((item) => {
    let vec = item.embedding;
    if (vec.length === targetDim) {
      return vec;
    }
    if (vec.length > targetDim) {
      const truncated = vec.slice(0, targetDim);
      const norm = Math.sqrt(truncated.reduce((sum, val) => sum + val * val, 0));
      return norm > 0 ? truncated.map((val) => val / norm) : truncated;
    }
    throw new AppError(
      502,
      'embedding_failed',
      `Embedding dimension mismatch: expected ${targetDim}, got ${vec.length}`
    );
  });
}

export async function embedQuery(text) {
  const [vec] = await embedTexts([text]);
  return vec;
}
