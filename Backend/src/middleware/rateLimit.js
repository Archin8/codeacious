import rateLimit from 'express-rate-limit';

const keyGenerator = (req) => {
  return req.user?.id || req.ip;
};

const handler = (_req, res, _next, options) => {
  res.status(options.statusCode).json({
    error: {
      code: 'rate_limit_exceeded',
      message: 'Too many requests, please try again later.',
    },
  });
};

// General API rate limiter: 120 requests / 1 minute
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator,
  validate: { keyGeneratorIpFallback: false },
  handler,
});

// Chat rate limiter: 15 requests / 1 minute
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator,
  validate: { keyGeneratorIpFallback: false },
  handler,
});
