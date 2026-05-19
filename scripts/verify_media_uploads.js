const path = require('path');
const fs = require('fs');
const { isCloudinaryConfigured, storage } = require('../server/config/cloudinary');

console.log('🧪 Starting Media Upload Architecture verification...');

async function testSuite() {
  try {
    console.log(`  Cloudinary Configured State: ${isCloudinaryConfigured}`);

    if (isCloudinaryConfigured) {
      console.log('✅ Cloudinary is configured for production CDN!');
    } else {
      console.log('📁 Verifying local disk storage directory...');
      const uploadDir = path.join(__dirname, '../server/uploads');
      if (!fs.existsSync(uploadDir)) {
        throw new Error(`Assertion Failed: Uploads directory not created at ${uploadDir}`);
      }
      console.log('✅ Fallback upload directory exists!');

      // Test custom filename generator
      console.log('\nTesting filename serialization...');
      const testFile = { fieldname: 'images', originalname: 'apples.jpg' };
      
      const p = new Promise((resolve, reject) => {
        storage.getFilename(null, testFile, (err, filename) => {
          if (err) reject(err);
          else resolve(filename);
        });
      });

      const filename = await p;
      console.log(`  Generated filename: ${filename}`);
      if (!filename.startsWith('images-') || !filename.endsWith('.jpg')) {
        throw new Error('Assertion Failed: Filename formatting rules violated');
      }
      console.log('✅ Filename formatting rules matched format pattern!');
    }

    console.log('\n🏆 ALL MEDIA ARCHITECTURE TESTS PASSED!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Media Verification Failed:', error.message);
    process.exit(1);
  }
}

testSuite();
