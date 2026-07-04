// Custom sliding-window Rate Limiter
const ipRequestCounts = new Map();
const LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;

// Periodic cleanup of stale IPs from rate limiter map to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of ipRequestCounts.entries()) {
    const active = timestamps.filter(time => now - time < LIMIT_WINDOW_MS);
    if (active.length === 0) {
      ipRequestCounts.delete(ip);
    } else {
      ipRequestCounts.set(ip, active);
    }
  }
}, 5 * 60 * 1000).unref(); // Clean up every 5 minutes (unref prevents blocking process exit)

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
  
  // Widen CSP for fonts, Cloudinary imagery, and standard resources
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
    "img-src 'self' data: https://res.cloudinary.com https://images.unsplash.com http://localhost:5002 http://127.0.0.1:5002",
    "connect-src 'self' http://localhost:5002 http://127.0.0.1:5002"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', csp);
  next();
};

module.exports = {
  rateLimiter,
  nosqlSanitizer,
  securityHeaders
};
