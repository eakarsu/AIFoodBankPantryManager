const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

/**
 * AI endpoint rate limiter
 * 20 requests per hour per authenticated user (falls back to IP)
 */
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req) => (req.user ? `user:${req.user.id}` : ipKeyGenerator(req)),
  message: { error: 'Too many AI requests. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { aiRateLimiter };
