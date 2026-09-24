import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import * as ragService from '../services/rag.js';

const router = Router();

const chatSchema = z.object({
  body: z.object({
    question: z
      .string()
      .trim()
      .min(1, 'Question is required')
      .max(env.MAX_QUESTION_CHARS, `Question length cannot exceed ${env.MAX_QUESTION_CHARS} characters`),
    history: z
      .array(
        z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string().trim().min(1),
        })
      )
      .max(6, 'History cannot exceed 6 turns')
      .optional(),
    stream: z.boolean().optional().default(false),
  }),
});

// POST /api/chat - RAG question answering route (JSON or SSE stream)
router.post('/', validate(chatSchema), async (req, res, next) => {
  const { question, history, stream } = req.body;

  if (stream) {
    // ── 8.1 SSE Headers ──
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const controller = new AbortController();

    // Abort LLM stream when client disconnects
    req.on('close', () => {
      if (!res.writableEnded) {
        controller.abort();
      }
    });

    const sendEvent = (event, data) => {
      if (!res.writableEnded) {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      }
    };

    try {
      await ragService.answerQuestionStream(
        req.user.id,
        { question, history },
        {
          onSources: (sources) => sendEvent('sources', sources),
          onToken: (t) => sendEvent('token', { t }),
          signal: controller.signal,
        }
      );

      sendEvent('done', {});
      res.end();
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }
      logger.error({ err }, 'Error during SSE stream');
      sendEvent('error', {
        code: err.code || 'stream_error',
        message: err.message || 'Stream error occurred',
      });
      res.end();
    }
  } else {
    // ── Standard JSON mode ──
    try {
      const result = await ragService.answerQuestion(req.user.id, { question, history });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
});

export default router;
