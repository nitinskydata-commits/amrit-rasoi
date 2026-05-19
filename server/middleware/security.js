// Custom sliding-window Rate Limiter
const ipRequestCounts = new Map();
const LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;

const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const now = Date.now();
  
  if (!ipRequestCounts.has(ip)) {
    ipRequestCounts.set(ip, []);
  }
  
  const timestamps = ipRequestCounts.get(ip);
  // Filter out timestamps older than limit window
  const activeTimestamps = timestamps.filter(time => now - time < LIMIT_WINDOW_MS);
  
  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again after 1 minute.'
    });
  }
  
  activeTimestamps.push(now);
  ipRequestCounts.set(ip, activeTimestamps);
  next();
};

// NoSQL Query Injection Sanitizer
const sanitizeObject = (obj) => {
  if (obj instanceof Object) {
    for (const key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        console.warn(`🚨 [SecuritySanitizer] Key injection attempt blocked: ${key}`);
        delete obj[key];
      } else {
        sanitizeObject(obj[key]);
      }
    }
  }
};

const nosqlSanitizer = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
};

// Security HTTP Headers
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
};

module.exports = {
  rateLimiter,
  nosqlSanitizer,
  securityHeaders
};
