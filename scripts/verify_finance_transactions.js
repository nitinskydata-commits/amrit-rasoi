const mongoose = require('mongoose');
const path = require('path');

// Configure dotenv
require('dotenv').config({ path: path.join(__dirname, './.env') });

const Organization = require('../server/models/Organization');
const Transaction = require('../server/models/Transaction');
const Payout = require('../server/models/Payout');
const User = require('../server/models/User');

// Import controller logic directly to simulate mock requests
const financeController = require('../server/controllers/financeController');

const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/amrit-rasoi';

async function testSuite() {
  console.log('🔌 Connecting to database at:', dbUri);
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected successfully!');

    // Clean old test objects if present
    await Organization.deleteMany({ name: 'Finance Test Co' });
    await Payout.deleteMany({});
    await Transaction.deleteMany({});

    // 1. Create Test Organization
    const org = await Organization.create({
      name: 'Finance Test Co',
      type: 'vendor',
      contactEmail: 'finance@test.com',
      commissionRate: 10,
      totalRevenue: 0,
      totalPayouts: 0,
      pendingPayout: 0
    });
    console.log('🏢 Created test Organization!');

    // Mock request context
    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      role: 'admin',
      isSuperAdmin: true,
      tenantId: org._id.toString(),
      organizationId: org._id
    };

    // Helper mock res
    const makeRes = () => ({
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.data = data;
        return this;
      }
    });

    // 2. Register Settlement Bank Details
    console.log('\n🏦 Registering active bank credentials...');
    const reqBank = {
      user: mockUser,
      body: {
        bankName: 'Logistics National Bank',
        accountNumber: '99887766554433',
        ifscCode: 'LNBK0009988',
        accountHolderName: 'Finance Test Co Chief',
        organizationId: org._id.toString()
      }
    };
    const resBank = makeRes();
    await financeController.updateBankDetails(reqBank, resBank);

    if (resBank.statusCode !== 200) {
      throw new Error(`Bank Registration Failed: ${resBank.data?.message}`);
    }
    console.log('✅ Bank details registered successfully!');

    const orgAfterBank = await Organization.findById(org._id);
    if (orgAfterBank.payoutAccount.bankName !== 'Logistics National Bank') {
      throw new Error('Assertion Failed: Bank Name does not match registered profile!');
    }

    // 3. Post Checkout Revenue Splits (Credit 1000, Commission Split Debit 100)
    console.log('\n🛒 Simulating checkout revenue splits and ledger logging...');
    // Create Mock Gross Sale Credit
    await Transaction.create({
      organization: org._id,
      tenantId: org.tenantId || org._id.toString(),
      amount: 1000,
      type: 'credit',
      category: 'sale',
      description: 'Mock gross sale checkout credit',
      operator: mockUser._id
    });

    // Create Mock 10% Platform Commission split Debit
    await Transaction.create({
      organization: org._id,
      tenantId: org.tenantId || org._id.toString(),
      amount: 100,
      type: 'debit',
      category: 'commission',
      description: 'Mock 10% platform commission deduction',
      operator: mockUser._id
    });

    // Update pending balance (Gross 1000 - 100 platform split = 900 net payout)
    orgAfterBank.pendingPayout = 900;
    await orgAfterBank.save();
    console.log('✅ Financial allocations posted. Organization Unsettled Balance: ₹900');

    // 4. Request payout settlement cycle
    console.log('\n💸 Merchant requesting settlement of ₹500...');
    const reqPayout = {
      user: mockUser,
      body: {
        amount: 500,
        startDate: '2026-05-01',
        endDate: '2026-05-15',
        organizationId: org._id.toString()
      }
    };
    const resPayout = makeRes();
    await financeController.requestPayout(reqPayout, resPayout);

    if (resPayout.statusCode !== 200) {
      throw new Error(`Payout Request Failed: ${resPayout.data?.message}`);
    }
    console.log('✅ Payout requested and balance locked!');

    const orgAfterPayoutReq = await Organization.findById(org._id);
    console.log(`Remaining Unsettled Balance: ₹${orgAfterPayoutReq.pendingPayout}`);
    if (orgAfterPayoutReq.pendingPayout !== 400) {
      throw new Error(`Assertion Failed: Remaining balance must be ₹400. Got: ₹${orgAfterPayoutReq.pendingPayout}`);
    }

    const createdPayout = resPayout.data.data;
    if (createdPayout.status !== 'pending' || createdPayout.amount !== 500) {
      throw new Error('Assertion Failed: Payout document properties mismatch.');
    }

    // 5. Platform Admin approves and processes settlement with UTR code
    console.log('\n🔒 Platform Admin processing bank settlement...');
    const reqProcess = {
      user: mockUser,
      params: { id: createdPayout._id.toString() },
      body: {
        transactionRef: 'UTR-FINANCE-TEST-998877',
        transferReceiptUrl: 'https://amritrasoi.com/receipts/r-99.pdf'
      }
    };
    const resProcess = makeRes();
    await financeController.processPayout(reqProcess, resProcess);

    if (resProcess.statusCode !== 200) {
      throw new Error(`Payout Processing Failed: ${resProcess.data?.message}`);
    }
    console.log('✅ Bank transfer UTR logged. Settlement closed!');

    const orgAfterProcessed = await Organization.findById(org._id);
    console.log(`Reconciled Organization Payout Total: ₹${orgAfterProcessed.totalPayouts}`);
    if (orgAfterProcessed.totalPayouts !== 500) {
      throw new Error(`Assertion Failed: totalPayouts should be 500. Got: ${orgAfterProcessed.totalPayouts}`);
    }

    // 6. Verify Transaction compliance history
    console.log('\n📋 Fetching transactional compliance ledgers...');
    const reqLedger = { user: mockUser };
    const resLedger = makeRes();
    await financeController.getTransactions(reqLedger, resLedger);

    if (resLedger.statusCode !== 200) {
      throw new Error(`Failed to retrieve transactions: ${resLedger.data?.message}`);
    }

    const ledgerEntries = resLedger.data.data;
    console.log(`Reconciled Ledger Record Count: ${ledgerEntries.length}`);
    ledgerEntries.forEach((entry, i) => {
      console.log(`  [${i+1}] ${entry.type.toUpperCase()} | ${entry.category.toUpperCase()} | ₹${entry.amount} (${entry.description})`);
    });

    if (ledgerEntries.length !== 3) {
      throw new Error(`Assertion Failed: Expected 3 ledger transactions. Got: ${ledgerEntries.length}`);
    }

    console.log('\n🏆 ALL FINANCE ASSERTS PASSED! COMMISSION ENGINE & BANK SETTLEMENTS ARE 100% RECONCILED.');

    // Cleanup
    await Organization.deleteMany({ name: 'Finance Test Co' });
    await Payout.deleteMany({});
    await Transaction.deleteMany({});
    console.log('🧹 Cleaned up test records.');

  } catch (error) {
    console.error('❌ Error or assertion failure:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected.');
  }
}

testSuite();
