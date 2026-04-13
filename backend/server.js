const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env FIRST
dotenv.config({ path: './config/config.env' });

// Create app FIRST
const app = express();

// Connect DB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Serve uploads
app.use('/uploads', express.static('uploads'));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');

const brandRoutes = require('./routes/brandRoutes');
const couponRoutes = require('./routes/couponRoutes');
const collaborationRoutes = require('./routes/collaborationRoutes');
const advertisementRoutes = require('./routes/advertisementRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// ✅ NEW ROUTES (FIXED POSITION)
const testimonialRoutes = require('./routes/testimonials');
const badgeRoutes = require('./routes/badges');
const newsletterRoutes = require('./routes/newsletter');

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 SBMI API is running successfully!'
  });
});

// Debug logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Mount Routes
app.use('/api/v1', authRoutes);
app.use('/api/v1', productRoutes);
app.use('/api/v1', cartRoutes);
app.use('/api/v1', orderRoutes);
app.use('/api/v1', adminRoutes);

app.use('/api/v1', brandRoutes);
app.use('/api/v1', couponRoutes);
app.use('/api/v1', collaborationRoutes);
app.use('/api/v1', advertisementRoutes);
app.use('/api/v1', settingsRoutes);

// ✅ FIXED NEW ROUTES
app.use('/api/v1/testimonials', testimonialRoutes);
app.use('/api/v1/badges', badgeRoutes);
app.use('/api/v1/newsletter', newsletterRoutes);

const errorHandler = require('./middleware/errorHandler');

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.path);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: http://localhost:3000 & 3001`);
  console.log(`📁 Uploads folder: /uploads`);
  console.log(`${'='.repeat(50)}\n`);
});

// Error handling
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});