const Settings = require('../models/Settings');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { isCloudinaryConfigured } = require('../config/cloudinary');

// Get site settings (public)
exports.getSettings = async (req, res) => {
  try {
    console.log('📥 GET SETTINGS REQUEST');
    
    let settings = await Settings.findOne();
    
    if (!settings) {
      console.log('⚠️ No settings found, creating default...');
      settings = await Settings.create({
        siteName: 'SBMI - Amrit Rasoi',
        tagline: 'Fresh & Authentic Indian Food Products',
        supportEmail: 'admin@example.com',
        supportPhone: '+91 xxxxx xxxxx',
        companyAddress: '[Your Full Address Here]',
        companyLogo: { url: '' },
        codEnabled: true,
        onlinePaymentsEnabled: true,
        codMinOrder: 0,
        codMaxOrder: 50000,
        codExtraFee: 0
      });
    }
    
    console.log('✅ Settings found:', {
      siteName: settings.siteName,
      logoUrl: settings.companyLogo?.url
    });
    
    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('❌ GET SETTINGS ERROR:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update site settings (admin only)
exports.updateSettings = async (req, res) => {
  console.log('📝 UPDATE SETTINGS REQUEST');
  console.log('Body:', req.body);
  console.log('Files:', req.files);
  
  try {
    let settings = await Settings.findOne();
    
    // Create settings if not exists
    if (!settings) {
      settings = new Settings();
    }

    // Handle logo upload
    if (req.files && req.files.logo) {
      const file = req.files.logo[0];
      settings.companyLogo = {
        url: isCloudinaryConfigured ? file.path : `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
        public_id: file.filename // ✅ MATCHES MODEL
      };
      settings.markModified('companyLogo');
      console.log('🖼️ Logo updated:', settings.companyLogo);
    }

    // Handle favIcon upload
    if (req.files && req.files.favIcon) {
      const file = req.files.favIcon[0];
      settings.favIcon = {
        url: isCloudinaryConfigured ? file.path : `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
        public_id: file.filename // ✅ MATCHES MODEL
      };
      settings.markModified('favIcon');
      console.log('🖼️ FavIcon updated:', settings.favIcon);
    }
    
    // Update basic fields
    const fieldsToUpdate = [
      'siteName', 'tagline', 'supportEmail', 'supportPhone', 'companyAddress', 'deliveryAreaLabel',
      'codEnabled', 'onlinePaymentsEnabled', 'codMinOrder', 'codMaxOrder', 'codExtraFee',
      'refundPolicyText', 'shippingPolicyText', 'privacyPolicyText', 'termsAndConditionsText',
      'gstNumber', 'fssaiNumber', 'metaTitle', 'metaDescription', 'metaKeywords',
      'googleAnalyticsId', 'footerText', 'maintenanceMode'
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        // Convert strings to booleans if needed
        if (['codEnabled', 'onlinePaymentsEnabled', 'maintenanceMode'].includes(field)) {
          // Handle various string/boolean formats
          const val = req.body[field];
          settings[field] = val === 'true' || val === true || val === 'on' || val === '1';
        } 
        // Convert strings to numbers if needed
        else if (['codMinOrder', 'codMaxOrder', 'codExtraFee'].includes(field)) {
          settings[field] = Number(req.body[field]) || 0;
        }
        else {
          settings[field] = req.body[field];
        }
        console.log(`🔹 [UPDATE] Field: ${field} | Raw: ${req.body[field]} | Parsed: ${settings[field]}`);
      }
    });

    // Update social links (grouped)
    if (!settings.socialLinks) settings.socialLinks = {};
    const socialPlatforms = ['facebook', 'instagram', 'twitter', 'youtube', 'linkedin'];
    socialPlatforms.forEach(platform => {
      if (req.body[platform] !== undefined) {
        settings.socialLinks[platform] = req.body[platform];
        console.log(`🔹 Social link updated: ${platform} = ${req.body[platform]}`);
      }
    });
    settings.markModified('socialLinks');
    
    await settings.save();
    console.log('✅ Settings saved successfully to database');
    
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('❌ UPDATE SETTINGS ERROR DETAILS:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({
      success: false,
      message: `Failed to update settings: ${error.message}`
    });
  }
};

// Change admin password
exports.changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    const isPasswordMatched = await user.comparePassword(currentPassword);
    
    if (!isPasswordMatched) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
