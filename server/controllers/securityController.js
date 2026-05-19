const User = require('../models/User');

// Verify all backend authentication layers for the 6-Layer Vault
exports.verifySecurityVault = async (req, res) => {
  try {
    const { password, pin, answer, phone } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Super Admin account not found.'
      });
    }

    // 1. Password check
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
      return res.status(401).json({
        success: false,
        message: 'Security Verification Failed: Incorrect password.'
      });
    }

    // 2. PIN check
    if (user.securityPIN !== pin) {
      return res.status(401).json({
        success: false,
        message: 'Security Verification Failed: Incorrect 6-digit Secure PIN.'
      });
    }

    // 3. Question Answer check
    if (user.securityAnswer.toLowerCase().trim() !== answer.toLowerCase().trim()) {
      return res.status(401).json({
        success: false,
        message: 'Security Verification Failed: Incorrect secret answer.'
      });
    }

    // 4. Phone Confirmation check
    if (user.phone !== phone) {
      return res.status(401).json({
        success: false,
        message: 'Security Verification Failed: Incorrect phone number confirmation.'
      });
    }

    res.status(200).json({
      success: true,
      message: '🛡️ Vault Unlocked! All security parameters verified successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Super Admin Profile under 6-Layer Security Guard
exports.updateAdminCredentials = async (req, res) => {
  try {
    const { 
      password, pin, answer, phone, // Security checks
      newName, newEmail, newPhone, newPassword, newPIN, newQuestion, newAnswer // Updated details
    } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Super Admin account not found.'
      });
    }

    // Double-verify security vault inside update action for ultimate safety
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched || user.securityPIN !== pin || user.securityAnswer.toLowerCase().trim() !== answer.toLowerCase().trim() || user.phone !== phone) {
      return res.status(403).json({
        success: false,
        message: 'Critical Protection Blocked: Vault credentials mismatch. Profile update cancelled.'
      });
    }

    // Check if new Email or Phone is already used by another user
    if (newEmail && newEmail.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: newEmail.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'This email is already in use by another account.'
        });
      }
      user.email = newEmail.toLowerCase();
    }

    if (newPhone && newPhone !== user.phone) {
      const phoneExists = await User.findOne({ phone: newPhone });
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: 'This phone number is already in use by another account.'
        });
      }
      user.phone = newPhone;
    }

    // Update simple fields
    if (newName) user.name = newName;
    
    // Update credentials
    if (newPassword && newPassword.trim() !== '') {
      user.password = newPassword; // Will be hashed in the pre-save hook
    }

    // Update Security Vault answers
    if (newPIN) user.securityPIN = newPIN;
    if (newQuestion) user.securityQuestion = newQuestion;
    if (newAnswer) user.securityAnswer = newAnswer.toLowerCase().trim();

    await user.save();

    // Remove password from returned user details
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: '🎉 Success: Super Admin credentials and Security Vault updated successfully!',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
