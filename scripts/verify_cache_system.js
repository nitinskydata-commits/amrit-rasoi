const cacheManager = require('../server/utils/cache');

console.log('🧪 Starting Cache Layer Architecture verification...');

async function testSuite() {
  try {
    const testKey = 'products:organic:apples';
    const testData = { name: 'Fresh Apples', stock: 100 };

    // 1. Check Initial Cache Miss
    console.log('\n[1/4] Verifying cache miss on empty key...');
    const val1 = await cacheManager.get(testKey);
    if (val1 !== null) {
      throw new Error('Assertion Failed: New cache key should return null');
    }
    console.log('✅ Cache miss verified successfully!');

    // 2. Set key and assert cache HIT
    console.log('\n[2/4] Verifying cache hit after setting key...');
    await cacheManager.set(testKey, testData, 10); // 10s TTL
    const val2 = await cacheManager.get(testKey);
    if (!val2 || val2.name !== 'Fresh Apples') {
      throw new Error('Assertion Failed: Cache hit failed to retrieve correct data');
    }
    console.log('✅ Cache hit retrieved correct serialized payload!');

    // 3. Test Manual Cache Invalidation
    console.log('\n[3/4] Verifying cache invalidation...');
    await cacheManager.del(testKey);
    const val3 = await cacheManager.get(testKey);
    if (val3 !== null) {
      throw new Error('Assertion Failed: Key should be deleted');
    }
    console.log('✅ Invalidation successfully cleared cached data!');

    // 4. Test Expiration with 1s TTL
    console.log('\n[4/4] Verifying TTL-based automated cache eviction...');
    await cacheManager.set(testKey, testData, 1); // 1s TTL
    console.log('  Waiting 1100ms for key to expire...');
    await new Promise(resolve => setTimeout(resolve, 1100));

    const val4 = await cacheManager.get(testKey);
    if (val4 !== null) {
      throw new Error('Assertion Failed: Key should have expired and returned null');
    }
    console.log('✅ TTL eviction verified successfully!');

    console.log('\n🏆 ALL CACHE LAYER ARCHITECTURE TESTS PASSED!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Cache Verification Failed:', error.message);
    process.exit(1);
  }
}

testSuite();
