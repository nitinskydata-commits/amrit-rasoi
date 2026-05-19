class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  set(key, value, ttlSeconds = 300) {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.store.set(key, { value: JSON.stringify(value), expiresAt });
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    try {
      return JSON.parse(item.value);
    } catch (e) {
      return item.value;
    }
  }

  del(key) {
    this.store.delete(key);
  }

  flush() {
    this.store.clear();
  }
}

const localCache = new MemoryCache();

const cacheManager = {
  async get(key) {
    // Production note: Fallback to Redis client connection if present
    const val = localCache.get(key);
    if (val) {
      console.log(`⚡ [CacheManager] Cache HIT for key: ${key}`);
      return val;
    }
    console.log(`⚡ [CacheManager] Cache MISS for key: ${key}`);
    return null;
  },

  async set(key, value, ttlSeconds = 300) {
    localCache.set(key, value, ttlSeconds);
    console.log(`⚡ [CacheManager] Cache SET for key: ${key} (TTL: ${ttlSeconds}s)`);
  },

  async del(key) {
    localCache.del(key);
    console.log(`⚡ [CacheManager] Cache INVALIDATED for key: ${key}`);
  },

  async flush() {
    localCache.flush();
    console.log(`⚡ [CacheManager] Cache FLUSHED`);
  }
};

module.exports = cacheManager;
