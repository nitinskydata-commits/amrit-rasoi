const User = require('../models/User');

// Generate OTP (Demo - In production use SMS service)
let otpStore = {};

// Register User
exports.register = async (req, res) => {
  console.log('🔵 REGISTER REQUEST RECEIVED:', req.body);
  try {
    const { name, email, phone, password } = req.body;

    const user = await User.create({
      name,
      email,
      phone,
      password
    });

    const token = user.getJwtToken();

    console.log('✅ User registered successfully:', user.email);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Login User
exports.login = async (req, res) => {
  console.log('🔵 LOGIN REQUEST RECEIVED:', req.body);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter email and password'
      });
    }

    const user = await User.findOne({ email });
    console.log("USER FROM DB:", user);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = user.getJwtToken();

    console.log('✅ User logged in successfully:', user.email);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Send OTP
exports.sendOTP = async (req, res) => {
  console.log('🔵 SEND OTP REQUEST RECEIVED:', req.body);
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    otpStore[phone] = otp;
    
    // In production, send OTP via SMS service
    console.log(`📱 OTP for ${phone}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      otp // Remove this in production
    });
  } catch (error) {
    console.error('❌ Send OTP error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  console.log('🔵 VERIFY OTP REQUEST RECEIVED:', req.body);
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone and OTP are required'
      });
    }

    console.log('🔍 Checking OTP:', { phone, otp, stored: otpStore[phone] });

    if (otpStore[phone] !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    delete otpStore[phone];

    let user = await User.findOne({ phone });

    if (!user) {
      console.log('📝 Creating new user for phone:', phone);
      user = await User.create({
        name: `User_${phone}`,
        email: `${phone}@sbmi.com`,
        phone
      });
    }

    const token = user.getJwtToken();

    console.log('✅ OTP verified successfully for:', phone);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Verify OTP error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get User Profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, phone },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== ADDRESS FUNCTIONS ====================

// Get All Addresses
exports.getAddresses = async (req, res) => {
  console.log('🔵 GET ADDRESSES REQUEST');
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      addresses: user.addresses || []
    });
  } catch (error) {
    console.error('❌ Get addresses error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add Address
exports.addAddress = async (req, res) => {
  console.log('🔵 ADD ADDRESS REQUEST:', req.body);
  try {
    const { name, phone, address, city, state, pincode, landmark } = req.body;

    // Validation
    if (!name || !phone || !address || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const user = await User.findById(req.user.id);

    // If this is the first address, make it default
    const isDefault = user.addresses.length === 0;

    // If new address is set as default, remove default from others
    if (isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      name,
      phone,
      address,
      city,
      state,
      pincode,
      landmark,
      isDefault
    });

    await user.save();

    console.log('✅ Address added successfully');

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      address: user.addresses[user.addresses.length - 1]
    });
  } catch (error) {
    console.error('❌ Add address error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Address
exports.updateAddress = async (req, res) => {
  console.log('🔵 UPDATE ADDRESS REQUEST:', req.params.id, req.body);
  try {
    const user = await User.findById(req.user.id);
    
    const addressIndex = user.addresses.findIndex(
      addr => addr._id.toString() === req.params.id
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Update address fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        user.addresses[addressIndex][key] = req.body[key];
      }
    });

    await user.save();

    console.log('✅ Address updated successfully');

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      address: user.addresses[addressIndex]
    });
  } catch (error) {
    console.error('❌ Update address error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete Address
exports.deleteAddress = async (req, res) => {
  console.log('🔵 DELETE ADDRESS REQUEST:', req.params.id);
  try {
    const user = await User.findById(req.user.id);

    const addressIndex = user.addresses.findIndex(
      addr => addr._id.toString() === req.params.id
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    user.addresses.splice(addressIndex, 1);
    await user.save();

    console.log('✅ Address deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete address error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Set Default Address
exports.setDefaultAddress = async (req, res) => {
  console.log('🔵 SET DEFAULT ADDRESS REQUEST:', req.params.id);
  try {
    const user = await User.findById(req.user.id);

    // Remove default from all addresses
    user.addresses.forEach(addr => {
      addr.isDefault = false;
    });

    // Set new default
    const addressIndex = user.addresses.findIndex(
      addr => addr._id.toString() === req.params.id
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    user.addresses[addressIndex].isDefault = true;
    await user.save();

    console.log('✅ Default address set successfully');

    res.status(200).json({
      success: true,
      message: 'Default address set successfully',
      address: user.addresses[addressIndex]
    });
  } catch (error) {
    console.error('❌ Set default address error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
