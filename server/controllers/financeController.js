const Transaction = require('../models/Transaction');
const Payout = require('../models/Payout');
const Organization = require('../models/Organization');
const { scopeQueryForActor } = require('../utils/accessControl');

// @desc    Get all transactions (scoped)
// @route   GET /api/v1/finance/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    const actorQuery = scopeQueryForActor(req.user);
    
    const transactions = await Transaction.find(actorQuery)
      .populate('organization', 'name type contactEmail')
      .populate('operator', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all payouts (scoped)
// @route   GET /api/v1/finance/payouts
// @access  Private
exports.getPayouts = async (req, res) => {
  try {
    const actorQuery = scopeQueryForActor(req.user);
    
    const payouts = await Payout.find(actorQuery)
      .populate('organization', 'name type contactEmail payoutAccount')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payouts.length,
      data: payouts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update organization bank credentials
// @route   PUT /api/v1/finance/bank-details
// @access  Private
exports.updateBankDetails = async (req, res) => {
  try {
    const { bankName, accountNumber, ifscCode, accountHolderName, upiId } = req.body;

    if (!bankName || !accountNumber || !ifscCode || !accountHolderName) {
      return res.status(400).json({
        success: false,
        message: 'All bank profile credentials are required.'
      });
    }

    // Determine target organization scoped to current user context
    const isPlatformAdmin = ['admin', 'platform_admin'].includes(req.user.role) || req.user.isSuperAdmin;
    let targetOrgId = req.user.organizationId || req.user.organization;

    // Platform admin can specify target organization explicitly
    if (isPlatformAdmin && req.body.organizationId) {
      targetOrgId = req.body.organizationId;
    }

    if (!targetOrgId) {
      return res.status(400).json({
        success: false,
        message: 'No active merchant organization bound to your profile.'
      });
    }

    const org = await Organization.findByIdAndUpdate(
      targetOrgId,
      {
        payoutAccount: {
          bankName,
          accountNumber,
          ifscCode,
          accountHolderName,
          upiId: upiId || ''
        }
      },
      { new: true }
    );

    if (!org) {
      return res.status(440).json({
        success: false,
        message: 'Organization profile not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Settlement bank profile credentials registered successfully.',
      data: org
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Request a payout cycle
// @route   POST /api/v1/finance/payouts/request
// @access  Private
exports.requestPayout = async (req, res) => {
  try {
    let orgId = req.user.organizationId || req.user.organization;
    const isPlatformAdmin = ['admin', 'platform_admin'].includes(req.user.role) || req.user.isSuperAdmin;
    
    if (isPlatformAdmin && req.body.organizationId) {
      orgId = req.body.organizationId;
    }

    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'No active merchant organization bound to your profile.'
      });
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Merchant organization not found.'
      });
    }

    if (!org.payoutAccount || !org.payoutAccount.bankName || !org.payoutAccount.accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please register your settlement bank profile credentials before requesting payouts.'
      });
    }

    const amountToSettle = req.body.amount ? Number(req.body.amount) : org.pendingPayout;

    if (amountToSettle <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Unsettled payout balance must be positive.'
      });
    }

    if (amountToSettle > org.pendingPayout) {
      return res.status(400).json({
        success: false,
        message: `Requested amount exceeds available unsettled balance: ₹${org.pendingPayout}`
      });
    }

    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the settlement billing period (startDate and endDate).'
      });
    }

    // Create a new Payout record in pending state
    const payout = await Payout.create({
      organization: org._id,
      tenantId: org.tenantId || org._id.toString(),
      amount: amountToSettle,
      bankDetails: {
        bankName: org.payoutAccount.bankName,
        accountNumber: org.payoutAccount.accountNumber,
        ifscCode: org.payoutAccount.ifscCode,
        accountHolderName: org.payoutAccount.accountHolderName
      },
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'pending'
    });

    // Deduct from pending payouts immediately to hold/lock
    org.pendingPayout -= amountToSettle;
    await org.save();

    res.status(200).json({
      success: true,
      message: 'Settlement payout request registered successfully.',
      data: payout
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Process/Settle a pending payout (Platform Admin only)
// @route   POST /api/v1/finance/payouts/:id/process
// @access  Private (Admin only)
exports.processPayout = async (req, res) => {
  try {
    const { transactionRef, transferReceiptUrl } = req.body;
    
    if (!transactionRef) {
      return res.status(400).json({
        success: false,
        message: 'Bank transfer UTR / IMPS Reference code is required to close settlements.'
      });
    }

    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Settlement payout record not found.'
      });
    }

    if (payout.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Payout has already been resolved in status: ${payout.status}`
      });
    }

    const org = await Organization.findById(payout.organization);
    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Merchant organization linked to this payout not found.'
      });
    }

    // Update payout status
    payout.status = 'processed';
    payout.transactionRef = transactionRef;
    if (transferReceiptUrl) payout.transferReceiptUrl = transferReceiptUrl;
    payout.processedBy = req.user._id;
    payout.processedAt = Date.now();
    await payout.save();

    // Reconcile Organization Aggregates
    org.totalPayouts += payout.amount;
    await org.save();

    // Reconcile and log into financial audit ledger
    await Transaction.create({
      organization: org._id,
      tenantId: org.tenantId || org._id.toString(),
      amount: payout.amount,
      type: 'debit',
      category: 'settlement',
      referenceId: payout._id.toString(),
      description: `Reconciled payout settlement billing range (${new Date(payout.startDate).toLocaleDateString()} - ${new Date(payout.endDate).toLocaleDateString()}) with Bank UTR: ${transactionRef}`,
      operator: req.user._id
    });

    res.status(200).json({
      success: true,
      message: 'Merchant settlement processed and closed successfully.',
      data: payout
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
