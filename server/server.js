const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env FIRST — use __dirname so it works from any cwd (monorepo root, server/ etc.)
dotenv.config({ path: path.join(__dirname, 'config', 'config.env') });

// Create app FIRST
const app = express();

// Connect DB
connectDB()
  .then(() => {
    const seedAdmin = require('./utils/seeder');
    seedAdmin();

    const { runDiscountEngine } = require('./utils/discountEngine');
    runDiscountEngine();

    // Auto-migrate nested product reviews to the standalone Review collection if missing
    const syncReviews = async () => {
      try {
        const Product = require('./models/Product');
        const Review = require('./models/Review');

        const products = await Product.find({ 'reviews.0': { $exists: true } });
        let addedCount = 0;

        for (const prod of products) {
          for (const nestedRev of prod.reviews) {
            const exists = await Review.findOne({
              product: prod._id,
              user: nestedRev.user
            });

            if (!exists) {
              await Review.create({
                product: prod._id,
                user: nestedRev.user,
                rating: nestedRev.rating,
                title: nestedRev.title || 'Product Review',
                comment: nestedRev.comment,
                images: nestedRev.images || [],
                verifiedPurchase: nestedRev.verifiedPurchase || false,
                createdAt: nestedRev.createdAt || new Date()
              });
              addedCount++;
            }
          }
        }
        if (addedCount > 0) {
          console.log(`✅ Synced ${addedCount} nested reviews to standalone Review collection.`);
        }
      } catch (err) {
        console.error('⚠️ Review synchronization failed:', err.message);
      }
    };
    syncReviews();
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB on startup. Server will stay up, but DB features will fail.', err.message);
  });

// Middleware
const { rateLimiter, nosqlSanitizer, securityHeaders } = require('./middleware/security');
app.use(securityHeaders);
app.use(rateLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(nosqlSanitizer);

const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CLIENT_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions =
  isProd && allowedOrigins.length > 0
    ? {
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
    }
    : { origin: true, credentials: true };

if (isProd && allowedOrigins.length === 0) {
  console.warn(
    'CLIENT_ORIGINS is empty; CORS allows all origins. Set CLIENT_ORIGINS to your storefront and admin URLs.'
  );
}

app.use(cors(corsOptions));

if (!isProd) {
  app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    next();
  });
}

// path is already required at the top

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const sellerRoutes = require('./routes/sellerRoutes');

const brandRoutes = require('./routes/brandRoutes');
const couponRoutes = require('./routes/couponRoutes');
const collaborationRoutes = require('./routes/collaborationRoutes');
const advertisementRoutes = require('./routes/advertisementRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// ✅ NEW ROUTES (FIXED POSITION)
const testimonialRoutes = require('./routes/testimonials');
const badgeRoutes = require('./routes/badges');
const newsletterRoutes = require('./routes/newsletter');
const organizationRoutes = require('./routes/organizationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const financeRoutes = require('./routes/financeRoutes');
const kycRoutes = require('./routes/kycRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');

// Load notification event subscribers
require('./utils/notificationService');
require('./utils/eventListeners');

// Health checks
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 SBMI API is running successfully!'
  });
});

app.get('/api/v1/health', async (req, res) => {
  const mongoose = require('mongoose');
  const cacheManager = require('./utils/cache');
  const { backgroundQueue } = require('./utils/queue');

  const start = Date.now();
  let dbStatus = 'disconnected';
  try {
    if (mongoose.connection.readyState === 1) {
      dbStatus = 'connected';
    }
  } catch (err) {}

  let cacheStatus = 'unresponsive';
  try {
    await cacheManager.set('health_check_ping', 'pong', 5);
    const val = await cacheManager.get('health_check_ping');
    if (val === 'pong') {
      cacheStatus = 'responsive';
    }
  } catch (err) {}

  res.status(200).json({
    success: true,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    dependencies: {
      database: dbStatus,
      cache: cacheStatus,
      queue: backgroundQueue ? 'active' : 'inactive'
    },
    latencyMs: Date.now() - start
  });
});

app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: '🚀 SBMI API v1 is available'
  });
});

// Mount Routes
app.use('/api/v1', authRoutes);
app.use('/api/v1', productRoutes);
app.use('/api/v1', cartRoutes);
app.use('/api/v1', orderRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/seller', sellerRoutes);

app.use('/api/v1', brandRoutes);
app.use('/api/v1', couponRoutes);
app.use('/api/v1', collaborationRoutes);
app.use('/api/v1', advertisementRoutes);
app.use('/api/v1', settingsRoutes);

// ✅ FIXED NEW ROUTES
app.use('/api/v1/testimonials', testimonialRoutes);
app.use('/api/v1/badges', badgeRoutes);
app.use('/api/v1/newsletter', newsletterRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1', wishlistRoutes);
app.use('/api/v1', paymentRoutes);
app.use('/api/v1', recommendationRoutes);
app.use('/api/v1', ticketRoutes);
app.use('/api/v1', kycRoutes);
app.use('/api/v1/vendor', vendorRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/warehouses', warehouseRoutes);

const errorHandler = require('./middleware/errorHandler');

// Error handler (Must be before 404 handler — catches thrown/next(err) errors from routes)
app.use(errorHandler);

// 404 handler (catches all unmatched routes AFTER error handler)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`
  });
});

// Start server
console.log(`🔍 PORT from env: ${process.env.PORT}`);
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: http://localhost:3000 & 3001`);
  console.log(`📁 Uploads folder: /uploads`);
  console.log(`${'='.repeat(50)}\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use (another Node/backend is probably running).`);
    console.error('   Fix: stop that process, or set PORT in config.env to e.g. 5001\n');
    console.error('   Windows — find PID:  netstat -ano | findstr :' + PORT);
    console.error('   Windows — free port: taskkill /PID <pid_from_last_column> /F\n');
  } else {
    console.error('❌ Server listen error:', err.message);
  }
  process.exit(1);
});

// Error handling - SAFELY LOG INSTEAD OF CRASHING
process.on('unhandledRejection', (err) => {
  console.error('⚠️ UNHANDLED REJECTION:', err.message || err);
  // process.exit(1); // ✅ DISABLED for development stability
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});


