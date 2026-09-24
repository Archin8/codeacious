import { AppError } from '../utils/errors.js';
import { logger } from '../lib/logger.js';

// eslint-disable-next-line no-unused-vars -- Express requires 4 params for error middleware
export function errorHandler(err, _req, res, _next) {
  // ── Known, controlled error ──
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
  }

  // ── Zod validation failure ──
  if (err.name === 'ZodError' && Array.isArray(err.issues)) {
    const message = err.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    return res.status(400).json({
      error: { code: 'validation_error', message },
    });
  }

  // ── Malformed JSON body parsing error ──
  if (
    (err instanceof SyntaxError && err.status === 400 && 'body' in err) ||
    err.type === 'entity.parse.failed'
  ) {
    return res.status(400).json({
      error: { code: 'invalid_json', message: 'Invalid JSON body' },
    });
  }

  // ── Upstream service timeout ──
  if (
    err.name === 'APIConnectionTimeoutError' ||
    err.code === 'ETIMEDOUT' ||
    err.status === 504 ||
    String(err.message || '').toLowerCase().includes('timeout')
  ) {
    return res.status(504).json({
      error: { code: 'upstream_timeout', message: 'Upstream service timed out' },
    });
  }

  // ── Unknown — log full stack server-side, return generic 500 to client ──
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: { code: 'internal_error', message: 'An unexpected error occurred' },
  });
}
