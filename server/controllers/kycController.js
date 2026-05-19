const Organization = require('../models/Organization');
const { writeAuditLog } = require('../utils/auditLogger');

// Submit KYC (Vendor/Partner)
exports.submitKYC = async (req, res) => {
  try {
    const { gstin, pan, bankName, accountNumber, ifscCode, upiId, accountHolderName, documentUrl } = req.body;

    // Find the organization owned by current user
    const organization = await Organization.findOne({ owner: req.user.id });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'No organization profile found for this seller'
      });
    }

    organization.gstin = gstin;
    organization.pan = pan;
    organization.documentUrl = documentUrl;
    organization.kycStatus = 'pending';
    organization.bankVerificationStatus = 'pending';

    // Update bank details
    organization.payoutAccount = {
      bankName,
      accountNumber,
      ifscCode,
      upiId,
      accountHolderName
    };

    await organization.save();

    await writeAuditLog({
      req,
      action: 'SELLER_KYC_SUBMITTED',
      targetModel: 'Organization',
      targetId: organization._id,
      newState: { kycStatus: 'pending', gstin, pan }
    });

    res.status(200).json({
      success: true,
      message: 'KYC details submitted successfully for review',
      organization
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get KYC Details
exports.getKYCDetails = async (req, res) => {
  try {
    const organization = await Organization.findOne({ owner: req.user.id });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'No organization profile found for this seller'
      });
    }

    res.status(200).json({
      success: true,
      kycDetails: {
        kycStatus: organization.kycStatus,
        gstin: organization.gstin,
        pan: organization.pan,
        bankVerificationStatus: organization.bankVerificationStatus,
        documentUrl: organization.documentUrl,
        payoutAccount: organization.payoutAccount,
        kycRemarks: organization.kycRemarks,
        status: organization.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Admin Review KYC (Admin/Staff only)
exports.reviewKYC = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { action, remarks } = req.body; // action: 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Specify "approve" or "reject"'
      });
    }

    const organization = await Organization.findById(orgId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    if (action === 'approve') {
      organization.kycStatus = 'approved';
      organization.status = 'active';
      organization.bankVerificationStatus = 'verified';
      organization.kycRemarks = remarks || 'KYC approved by platform administration';
    } else {
      organization.kycStatus = 'rejected';
      organization.bankVerificationStatus = 'failed';
      organization.kycRemarks = remarks || 'KYC rejected. Please verify documents';
    }

    await organization.save();

    await writeAuditLog({
      req,
      action: 'SELLER_KYC_REVIEWED',
      targetModel: 'Organization',
      targetId: organization._id,
      newState: { kycStatus: organization.kycStatus, status: organization.status }
    });

    res.status(200).json({
      success: true,
      message: `Seller KYC has been successfully ${action}d.`,
      organization
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
