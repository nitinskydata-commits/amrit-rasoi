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

// Register Delivery Boy (Public)
exports.registerDeliveryBoy = async (req, res) => {
  console.log('🔵 DELIVERY BOY REGISTRATION RECEIVED:', req.body);
  try {
    const { name, email, phone, password, branchName } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email or phone number already exists.'
      });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'delivery_boy',
      branchName: branchName || 'Unassigned',
      permissions: {
        manageProducts: false,
        manageOrders: true, // Needed to use the logistics dashboard
        manageReviews: false,
        manageNewsletters: false,
        manageInventory: false
      }
    });

    const token = user.getJwtToken();
    console.log('✅ Delivery Boy registered successfully:', user.email);

    res.status(201).json({
      success: true,
      token,
      message: 'Delivery Partner application successful! You can now access your dashboard.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        branchName: user.branchName
      }
    });
  } catch (error) {
    console.error('❌ Delivery Boy Registration error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Register Seller (Public — Application for Seller Account)
exports.registerSeller = async (req, res) => {
  console.log('🔵 SELLER REGISTRATION RECEIVED:', req.body);
  try {
    const { name, email, phone, password, shopName, shopDescription, gstin, pan, bankDetails, businessAddress } = req.body;

    // Check if the user is already authenticated via JWT token in headers
    let currentUser = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        currentUser = await User.findById(decoded.id);
      } catch (err) {
        console.warn('Optional token verification failed in registerSeller:', err.message);
      }
    }

    // If already logged in, upgrade current user directly
    if (currentUser) {
      if (currentUser.sellerStatus === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'You already have a pending seller application. Please wait for admin approval.'
        });
      }
      if (currentUser.sellerStatus === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'You already have an approved seller account. Please login to your dashboard.'
        });
      }

      if (currentUser.role === 'user' || currentUser.role === 'customer' || !currentUser.role) {
        currentUser.role = 'vendor_owner';
      }
      currentUser.sellerStatus = 'pending';
      currentUser.sellerProfile = {
        shopName: shopName || '',
        shopDescription: shopDescription || '',
        gstin: gstin || '',
        pan: pan || '',
        bankDetails: bankDetails || {},
        businessAddress: businessAddress || {},
        appliedAt: new Date(),
        rejectionReason: ''
      };
      await currentUser.save();

      const token = currentUser.getJwtToken();
      return res.status(200).json({
        success: true,
        message: 'Your seller account application has been submitted for review. You will be notified once approved.',
        token,
        user: {
          id: currentUser._id,
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone,
          role: currentUser.role,
          sellerStatus: currentUser.sellerStatus,
          sellerProfile: currentUser.sellerProfile
        }
      });
    }

    // If not logged in, check for existing user by email/phone
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      // Security Check: Verify password for the existing user account
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email/phone already exists. Please provide your password to upgrade to a seller.'
        });
      }
      const isPasswordMatched = await existingUser.comparePassword(password);
      if (!isPasswordMatched) {
        return res.status(401).json({
          success: false,
          message: 'An account with this email/phone already exists, and the password entered is incorrect.'
        });
      }

      // Check seller application status
      if (existingUser.sellerStatus === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'You already have a pending seller application. Please wait for admin approval.'
        });
      }

      if (existingUser.sellerStatus === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'You already have an approved seller account. Please login to your dashboard.'
        });
      }

      // Upgrade existing account to seller applicant (keep admin role privileges if already admin)
      if (existingUser.role === 'user' || existingUser.role === 'customer' || !existingUser.role) {
        existingUser.role = 'vendor_owner';
      }
      existingUser.sellerStatus = 'pending';
      existingUser.sellerProfile = {
        shopName: shopName || '',
        shopDescription: shopDescription || '',
        gstin: gstin || '',
        pan: pan || '',
        bankDetails: bankDetails || {},
        businessAddress: businessAddress || {},
        appliedAt: new Date(),
        rejectionReason: ''
      };
      await existingUser.save();

      const token = existingUser.getJwtToken();
      return res.status(200).json({
        success: true,
        message: 'Your seller account application has been submitted for review. You will be notified once approved.',
        token,
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          phone: existingUser.phone,
          role: existingUser.role,
          sellerStatus: existingUser.sellerStatus,
          sellerProfile: existingUser.sellerProfile
        }
      });
    }

    // Create new user as seller applicant
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'vendor_owner',
      sellerStatus: 'pending',
      sellerProfile: {
        shopName: shopName || '',
        shopDescription: shopDescription || '',
        gstin: gstin || '',
        pan: pan || '',
        bankDetails: bankDetails || {},
        businessAddress: businessAddress || {},
        appliedAt: new Date()
      },
      permissions: {
        manageProducts: true,
        manageOrders: true,
        manageReviews: true,
        manageInventory: true,
        manageNewsletters: false
      }
    });

    const token = user.getJwtToken();
    console.log('✅ Seller application submitted:', user.email);

    res.status(201).json({
      success: true,
      message: 'Your seller account application has been submitted for review. You will be notified once approved.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        sellerStatus: user.sellerStatus,
        sellerProfile: user.sellerProfile
      }
    });
  } catch (error) {
    console.error('❌ Seller Registration error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get Seller Application Status
exports.getSellerStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      sellerStatus: user.sellerStatus,
      sellerProfile: user.sellerProfile,
      organizationId: user.organizationId
    });
  } catch (error) {
    res.status(500).json({
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
      console.log('❌ Login failed: User not found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
      console.log('❌ Login failed: Incorrect password for user:', email);
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
        role: user.role,
        isSuperAdmin: user.isSuperAdmin || false,
        permissions: user.permissions,
        organization: user.organization,
        organizationId: user.organizationId,
        organizationType: user.organizationType,
        tenantId: user.tenantId,
        collaboration: user.collaboration,
        sellerStatus: user.sellerStatus || 'none',
        sellerProfile: user.sellerProfile || {}
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    
    // Check if it's a timeout error
    if (error.name === 'MongooseError' || error.message.includes('buffering timed out')) {
      return res.status(503).json({
        success: false,
        message: 'Database connection error. Please try again later or check server logs.'
      });
    }

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
      message: 'OTP sent successfully'
      // OTP is logged to server console for development — never sent in response
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
        role: user.role,
        isSuperAdmin: user.isSuperAdmin || false,
        permissions: user.permissions,
        organization: user.organization,
        organizationType: user.organizationType,
        tenantId: user.tenantId,
        collaboration: user.collaboration
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
    const { fullName, phone, addressLine1, addressLine2, city, state, pincode, addressType, isDefault } = req.body;

    // Validation
    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const user = await User.findById(req.user.id);

    // If setting as default, remove default from others
    if (isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // If this is the first address and not explicitly set as default, make it default
    const makeDefault = user.addresses.length === 0 && !isDefault ? true : isDefault;

    user.addresses.push({
      fullName,
      phone,
      addressLine1,
      addressLine2: addressLine2 || '',
      city,
      state,
      pincode,
      addressType: addressType || 'Home',
      isDefault: makeDefault
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

// Register Wholesale Buyer
exports.registerWholesale = async (req, res) => {
  console.log('🔵 WHOLESALE REGISTRATION RECEIVED:', req.body);
  try {
    const { name, email, phone, password, companyName, gstin, tradeLicense, businessAddress } = req.body;

    // Check if the user is already authenticated via JWT token in headers
    let currentUser = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        currentUser = await User.findById(decoded.id);
      } catch (err) {
        console.warn('Optional token verification failed in registerWholesale:', err.message);
      }
    }

    // If already logged in, upgrade current user directly
    if (currentUser) {
      if (currentUser.wholesaleStatus === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Your wholesale account application is already pending review.'
        });
      }
      if (currentUser.wholesaleStatus === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Your wholesale account is already approved and active.'
        });
      }

      currentUser.role = 'wholesale_buyer';
      currentUser.wholesaleStatus = 'pending';
      currentUser.wholesaleProfile = {
        companyName: companyName || '',
        gstin: gstin || '',
        tradeLicense: tradeLicense || '',
        businessAddress: businessAddress || '',
        appliedAt: new Date()
      };
      await currentUser.save();

      const token = currentUser.getJwtToken();
      return res.status(200).json({
        success: true,
        message: 'Your wholesale account application has been submitted for review.',
        token,
        user: currentUser
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      // Security Check: Verify password for the existing user account
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email/phone already exists. Please provide your password to upgrade to a wholesaler.'
        });
      }
      const isPasswordMatched = await existingUser.comparePassword(password);
      if (!isPasswordMatched) {
        return res.status(401).json({
          success: false,
          message: 'An account with this email/phone already exists, and the password entered is incorrect.'
        });
      }

      if (existingUser.wholesaleStatus === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Your wholesale account application is already pending review.'
        });
      }
      if (existingUser.wholesaleStatus === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Your wholesale account is already approved and active.'
        });
      }

      existingUser.role = 'wholesale_buyer';
      existingUser.wholesaleStatus = 'pending';
      existingUser.wholesaleProfile = {
        companyName: companyName || '',
        gstin: gstin || '',
        tradeLicense: tradeLicense || '',
        businessAddress: businessAddress || '',
        appliedAt: new Date()
      };
      await existingUser.save();

      const token = existingUser.getJwtToken();
      return res.status(200).json({
        success: true,
        message: 'Your wholesale account application has been submitted for review.',
        token,
        user: existingUser
      });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'wholesale_buyer',
      wholesaleStatus: 'pending',
      wholesaleProfile: {
        companyName: companyName || '',
        gstin: gstin || '',
        tradeLicense: tradeLicense || '',
        businessAddress: businessAddress || '',
        appliedAt: new Date()
      }
    });

    const token = user.getJwtToken();
    res.status(201).json({
      success: true,
      message: 'Wholesale application submitted successfully.',
      token,
      user
    });
  } catch (error) {
    console.error('❌ Wholesale Registration error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== SELLER PAYMENT GATEWAY SETUP ====================

// @desc    Seller submits payment gateway details after KYC approval
// @route   POST /api/v1/seller/payment-setup
// @access  Private (Authenticated User with kyc_approved status)
exports.submitPaymentGateway = async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    let currentUser = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      currentUser = await User.findById(decoded.id);
    }

    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (currentUser.sellerStatus !== 'kyc_approved') {
      return res.status(400).json({
        success: false,
        message: `Payment setup is only available after KYC approval. Your status: '${currentUser.sellerStatus}'.`
      });
    }

    const {
      upiId,
      bankName,
      accountNumber,
      ifscCode,
      accountHolderName,
      paymentGatewayProvider,
      merchantId
    } = req.body;

    if (!upiId && !accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'At least one payment method (UPI ID or Bank Account) is required.'
      });
    }

    currentUser.sellerProfile.paymentGateway = {
      upiId: upiId || '',
      bankName: bankName || '',
      accountNumber: accountNumber || '',
      ifscCode: ifscCode || '',
      accountHolderName: accountHolderName || '',
      paymentGatewayProvider: paymentGatewayProvider || '',
      merchantId: merchantId || '',
      submittedAt: new Date()
    };

    currentUser.sellerStatus = 'payment_pending';
    await currentUser.save();

    res.status(200).json({
      success: true,
      message: 'Payment gateway details submitted. Awaiting final admin approval.',
      user: {
        sellerStatus: currentUser.sellerStatus,
        sellerProfile: currentUser.sellerProfile
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get seller's current pipeline status
// @route   GET /api/v1/seller/status
// @access  Private
exports.getSellerStatus = async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    let currentUser = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      currentUser = await User.findById(decoded.id);
    }

    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    res.status(200).json({
      success: true,
      sellerStatus: currentUser.sellerStatus,
      sellerProfile: currentUser.sellerProfile,
      name: currentUser.name,
      email: currentUser.email
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

