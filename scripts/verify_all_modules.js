const { execSync } = require('child_process');
const path = require('path');

const testScripts = [
  { name: 'Analytics Pipeline', path: path.join(__dirname, './verify_analytics.js') },
  { name: 'Finance & Bank Splits', path: path.join(__dirname, './verify_finance_transactions.js') },
  { name: 'Decoupled Notifications & Events', path: path.join(__dirname, './verify_notifications.js') },
  { name: 'Logistics & Warehousing Math', path: path.join(__dirname, './verify_warehouse_transfers.js') },
  { name: 'Commission Rates Splits', path: path.join(__dirname, './verify_payouts_commission.js') },
  { name: 'RBAC & Tenancy Isolation', path: path.join(__dirname, './verify_rbac_isolation.js') },
  { name: 'Authentication flow and JWT Scopes', path: path.join(__dirname, './verify_authentication.js') },
  { name: 'Product Variant Architecture & Ratings', path: path.join(__dirname, './verify_product_variants.js') },
  { name: 'Order Split Math & Lifecycle States', path: path.join(__dirname, './verify_order_domain.js') },
  { name: 'Logistics Doorstep OTP Handshake', path: path.join(__dirname, './verify_logistics_otp.js') },
  { name: 'Background Asynchronous Job Queue', path: path.join(__dirname, './verify_background_queue.js') },
  { name: 'Advanced Search Query & Autocomplete', path: path.join(__dirname, './verify_search_engine.js') },
  { name: 'Enterprise Cache Eviction & TTL', path: path.join(__dirname, './verify_cache_system.js') },
  { name: 'Media Upload Object & Fallback Storage', path: path.join(__dirname, './verify_media_uploads.js') },
  { name: 'Multichannel Notification Broadcasts', path: path.join(__dirname, './verify_multichannel_notifications.js') },
  { name: 'Analytics Aggregates & Demand Forecasts', path: path.join(__dirname, './verify_analytics_engine.js') },
  { name: 'Audit Compliance Log Mapping', path: path.join(__dirname, './verify_audit_compliance.js') },
  { name: 'Observability Stack & System Health Check', path: path.join(__dirname, './verify_observability.js') },
  { name: 'Enterprise Security Rate Limiter & Sanitization', path: path.join(__dirname, './verify_security_rules.js') },
  { name: 'Scaling Shard-Key Compound Indexes', path: path.join(__dirname, './verify_scaling_indexes.js') }
];

console.log('🏁 Starting complete Digital Commerce OS Integration verification...\n');

let passCount = 0;

testScripts.forEach((test, idx) => {
  console.log(`[${idx + 1}/${testScripts.length}] Running validation for: ${test.name}...`);
  try {
    const output = execSync(`node "${test.path}"`, { encoding: 'utf8', stdio: 'pipe' });
    console.log(output);
    console.log(`✅ ${test.name} validation passed successfully!\n`);
    passCount++;
  } catch (err) {
    console.error(`❌ ${test.name} validation failed with error:`);
    console.error(err.stdout || err.stderr || err.message);
    console.error('--------------------------------------------------\n');
  }
});

console.log('==================================================');
if (passCount === testScripts.length) {
  console.log(`🎉 ALL ${passCount}/${testScripts.length} MODULES ARE FULLY INTERCONNECTED & FUNCTIONAL!`);
  process.exit(0);
} else {
  console.error(`⚠️ Verification completed with failures. Passed: ${passCount}/${testScripts.length}`);
  process.exit(1);
}
