const { rateLimiter, nosqlSanitizer, securityHeaders } = require('../server/middleware/security');

console.log('🧪 Starting Security Architecture verification...');

function testSuite() {
  try {
    // 1. Test security headers
    console.log('\n[1/3] Verifying Security HTTP Headers...');
    const headers = {};
    const resHeaders = {
      setHeader(name, val) {
        headers[name] = val;
      }
    };
    securityHeaders({}, resHeaders, () => {});

    console.log(`  X-Content-Type-Options: ${headers['X-Content-Type-Options']}`);
    console.log(`  X-Frame-Options: ${headers['X-Frame-Options']}`);
    console.log(`  X-XSS-Protection: ${headers['X-XSS-Protection']}`);

    if (headers['X-Frame-Options'] !== 'DENY' || headers['X-Content-Type-Options'] !== 'nosniff') {
      throw new Error('Assertion Failed: Security headers not set correctly');
    }
    console.log('✅ Security HTTP headers verified!');

    // 2. Test NoSQL Injection Sanitizer
    console.log('\n[2/3] Verifying NoSQL Injection Sanitization...');
    const reqSanitize = {
      body: {
        email: 'attacker@sbmi.com',
        password: { $gt: '' } // Query injection pattern
      },
      query: {
        category: 'Organic',
        '$where': 'true' // Query injection pattern
      }
    };
    nosqlSanitizer(reqSanitize, {}, () => {});

    console.log(`  Sanitized body: ${JSON.stringify(reqSanitize.body)}`);
    console.log(`  Sanitized query: ${JSON.stringify(reqSanitize.query)}`);

    if (reqSanitize.body.password.$gt !== undefined || reqSanitize.query['$where'] !== undefined) {
      throw new Error('Assertion Failed: Query injection keys were not stripped');
    }
    console.log('✅ Query injection keys stripped successfully!');

    // 3. Test Rate Limiting
    console.log('\n[3/3] Verifying API rate limiting protection (100 request threshold)...');
    const mockReq = { ip: '1.2.3.4' };
    let statusReturned = 200;
    const mockRes = {
      status(code) {
        statusReturned = code;
        return this;
      },
      json(data) {
        this.data = data;
        return this;
      }
    };

    // Simulate 101 requests from the same IP
    for (let i = 0; i < 101; i++) {
      rateLimiter(mockReq, mockRes, () => {});
    }

    console.log(`  Request 101 status code: ${statusReturned}`);
    if (statusReturned !== 429) {
      throw new Error(`Assertion Failed: Rate limiter did not reject request 101 with 429`);
    }
    console.log('✅ Rate limiting correctly blocked excess traffic!');

    console.log('\n🏆 ALL SECURITY ARCHITECTURE TESTS PASSED!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Security Verification Failed:', error.message);
    process.exit(1);
  }
}

testSuite();
