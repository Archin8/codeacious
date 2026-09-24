import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/errors.js';
import healthRouter from './routes/health.js';
import notesRouter from './routes/notes.js';
import chatRouter from './routes/chat.js';
import { requireAuth } from './middleware/auth.js';
import { apiLimiter, chatLimiter } from './middleware/rateLimit.js';

const app = express();

// ── 1. Trust proxy (required on Render, otherwise rate limiting sees the proxy IP) ──
app.set('trust proxy', 1);

// ── 2. Helmet — secure default headers ──
app.use(helmet());

// ── 3. CORS — exact origins from CLIENT_URL (comma-separated), no wildcard ──
const allowList = env.CLIENT_URL.split(',').map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    origin: allowList,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  }),
);

// ── 4. Request logger (redact the authorization header) ──
app.use(
  pinoHttp({
    logger,
    redact: ['req.headers.authorization'],
  }),
);

// ── 5. JSON body parser ──
app.use(express.json({ limit: '100kb' }));

// ── 6a. Public routes ──
app.use(healthRouter);

// ── 6b. Protected /api routes with rate limiting ──
app.use('/api', apiLimiter);
app.use('/api/chat', chatLimiter, requireAuth, chatRouter);
app.use('/api/notes', requireAuth, notesRouter);

// ── 7a. 404 handler for unknown routes ──
app.use((_req, _res, next) => {
  next(new AppError(404, 'not_found', 'Route not found'));
});

// ── 7b. Central error handler (must be last) ──
app.use(errorHandler);

export default app;
