const User = require('../models/User');

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP
exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Validate phone number (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone number. Enter 10 digits starting with 6-9' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find or create user
    let user = await User.findOne({ phone });
    
    if (!user) {
      // Create new user with phone
      user = await User.create({
        phone,
        name: `User_${phone.slice(-4)}`,
        otp,
        otpExpiry
      });
    } else {
      // Update existing user
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save({ validateBeforeSave: false });
    }

    // TODO: Send OTP via SMS gateway (Twilio, MSG91, Fast2SMS, etc.)
    console.log(`📱 OTP for ${phone}: ${otp}`);

    res.json({ 
      success: true,
      message: 'OTP sent successfully to your mobile number',
      // FOR DEVELOPMENT ONLY - Remove in production
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send OTP. Please try again.' 
    });
  }
};

// Verify OTP and login
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone and OTP are required' 
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found. Please register first.' 
      });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ 
        success: false,
        message: 'OTP not found. Please request a new OTP' 
      });
    }

    if (new Date() > user.otpExpiry) {
      // Clear expired OTP
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save({ validateBeforeSave: false });
      
      return res.status(400).json({ 
        success: false,
        message: 'OTP has expired. Please request a new one' 
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid OTP. Please try again' 
      });
    }

    // OTP verified successfully - clear OTP fields
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    const token = user.generateAuthToken();

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to verify OTP. Please try again.' 
    });
  }
};
