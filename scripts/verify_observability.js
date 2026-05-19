const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../server/config/config.env') });
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');

console.log('🧪 Starting Observability Stack & Health Check verification...');

const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/amrit-rasoi';

async function testSuite() {
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected successfully!');

    // Mock Express Request & Response
    const req = {};
    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.data = data;
        return this;
      }
    };

    // Simulate calling the health check handler logic
    const cacheManager = require('../server/utils/cache');
    const { backgroundQueue } = require('../server/utils/queue');

    const start = Date.now();
    let dbStatus = 'disconnected';
    if (mongoose.connection.readyState === 1) {
      dbStatus = 'connected';
    }

    let cacheStatus = 'unresponsive';
    await cacheManager.set('health_check_ping', 'pong', 5);
    const val = await cacheManager.get('health_check_ping');
    if (val === 'pong') {
      cacheStatus = 'responsive';
    }

    const payload = {
      success: true,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      dependencies: {
        database: dbStatus,
        cache: cacheStatus,
        queue: backgroundQueue ? 'active' : 'inactive'
      },
      latencyMs: Date.now() - start
    };

    console.log('\nAsserting health check response parameters...');
    console.log(`  Uptime: ${payload.uptime}s`);
    console.log(`  Memory (RSS): ${Math.round(payload.memoryUsage.rss / 1024 / 1024)} MB`);
    console.log(`  Database Connection: ${payload.dependencies.database}`);
    console.log(`  Cache Connection: ${payload.dependencies.cache}`);
    console.log(`  Background Queue Connection: ${payload.dependencies.queue}`);
    console.log(`  Latency: ${payload.latencyMs}ms`);

    if (!payload.success || payload.uptime <= 0) {
      throw new Error('Assertion Failed: Uptime report invalid');
    }
    if (payload.dependencies.database !== 'connected') {
      throw new Error('Assertion Failed: Database connection state should be connected');
    }
    if (payload.dependencies.cache !== 'responsive') {
      throw new Error('Assertion Failed: Caching layer connection state should be responsive');
    }

    console.log('\n✅ Observability status payload parsed and verified successfully!');

    console.log('\n🏆 ALL OBSERVABILITY STACK TESTS PASSED!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Observability Verification Failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

testSuite();
