const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../server/config/config.env') });
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../server/models/User');
const { isAuthenticatedUser, authorizePermissions } = require('../server/middleware/auth');

console.log('🧪 Starting Authentication Architecture verification...');

const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/amrit-rasoi';

async function testSuite() {
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected successfully!');

    // Clean old test objects if present
    await User.deleteMany({ email: 'authtest@sbmi.com' });

    // 1. Create a Test Vendor Owner with specific permissions
    console.log('\n[1/3] Creating user with organization scope and permissions...');
    const orgId = new mongoose.Types.ObjectId();
    const testUser = await User.create({
      name: 'Auth Test Owner',
      email: 'authtest@sbmi.com',
      password: 'password123',
      phone: '9000000001',
      role: 'vendor_owner',
      organizationId: orgId,
      permissions: {
        manageProducts: true,
        manageInventory: true,
        manageOrders: false
      }
    });

    // 2. Validate JWT Generation
    console.log('\n[2/3] Generating and decoding JWT...');
    const token = testUser.getJwtToken();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('  Decoded token payload ID:', decoded.id);
    
    if (decoded.id !== testUser._id.toString()) {
      throw new Error('Assertion Failed: Token payload ID does not match user ID');
    }
    console.log('✅ Token generated and decoded successfully!');

    // 3. Test Authorization Middleware Mock
    console.log('\n[3/3] Testing authorization middleware roles and permissions...');
    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    
    // Simulate isAuthenticatedUser middleware
    let authenticated = false;
    const mockRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.data = data;
        return this;
      }
    };
    const nextMock = () => { authenticated = true; };

    await isAuthenticatedUser(req, mockRes, nextMock);
    if (!authenticated || req.user._id.toString() !== testUser._id.toString()) {
      throw new Error('Assertion Failed: Authentication middleware failed to parse and attach user');
    }
    console.log('✅ Authentication middleware successfully resolved user profile!');

    // Verify permission check: vendor_owner has manageProducts
    let authorized = false;
    const authorizeMiddleware = authorizePermissions('manageProducts');
    const authNextMock = () => { authorized = true; };
    
    authorizeMiddleware(req, mockRes, authNextMock);
    if (!authorized) {
      throw new Error('Assertion Failed: User should be authorized to manageProducts');
    }
    console.log('✅ User authorized successfully for permitted action!');

    // Verify permission check denial: vendor_owner does NOT have manageOrders
    let denied = false;
    const denyResMock = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        denied = true;
        this.data = data;
        return this;
      }
    };
    let authorizedForOrders = false;
    const authorizeOrdersMiddleware = authorizePermissions('manageOrders');
    const authOrdersNextMock = () => { authorizedForOrders = true; };

    authorizeOrdersMiddleware(req, denyResMock, authOrdersNextMock);
    if (authorizedForOrders || !denied || denyResMock.statusCode !== 403) {
      throw new Error('Assertion Failed: User should be denied access to manageOrders');
    }
    console.log('✅ Authorization middleware successfully blocked unauthorized action!');

    console.log('\n🏆 ALL AUTHENTICATION FLOW TESTS PASSED!');
    
    // Cleanup
    await User.deleteMany({ email: 'authtest@sbmi.com' });
    process.exit(0);

  } catch (error) {
    console.error('❌ Auth Verification Failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

testSuite();
