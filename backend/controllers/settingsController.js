const Settings = require('../models/Settings');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

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
        supportEmail: 'support@sbmi.com',
        supportPhone: '+91 1234567890',
        companyAddress: 'Baliali, Punjab, India',
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
  console.log('File:', req.file);
  
  try {
    let settings = await Settings.findOne();
    
    // Handle logo upload - FIXED TO USE companyLogo
    if (req.file) {
      req.body.companyLogo = {
        url: req.protocol + '://' + req.get('host') + '/uploads/' + req.file.filename,
        public_id: req.file.filename
      };
      console.log('🖼️ Logo uploaded:', req.body.companyLogo);
    }
    
    if (!settings) {
      settings = await Settings.create(req.body);
      console.log('✅ Settings created');
    } else {
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined && req.body[key] !== '') {
          settings[key] = req.body[key];
        }
      });
      
      await settings.save();
      console.log('✅ Settings updated');
    }
    
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('❌ Update settings error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
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
