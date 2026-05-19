const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
const mongoose = require('mongoose');
const { getRoleLevel, canAssignRole, scopeQueryForActor } = require('../server/utils/accessControl');

console.log('🧪 Starting RBAC and Multi-Tenant Isolation verification...');

try {
  // 1. Role Level Asserts
  console.log('\n[1/3] Verifying role level hierarchy order...');
  const adminLvl = getRoleLevel('admin');
  const orgOwnerLvl = getRoleLevel('vendor_owner');
  const warehouseMgrLvl = getRoleLevel('warehouse_manager');
  const deliveryLvl = getRoleLevel('delivery_agent');
  const userLvl = getRoleLevel('user');

  console.log(`  Admin level: ${adminLvl}`);
  console.log(`  Vendor Owner level: ${orgOwnerLvl}`);
  console.log(`  Warehouse Manager level: ${warehouseMgrLvl}`);
  console.log(`  Delivery Agent level: ${deliveryLvl}`);
  console.log(`  User level: ${userLvl}`);

  if (adminLvl !== 0) throw new Error('Assertion Failed: Admin must be level 0');
  if (orgOwnerLvl !== 2) throw new Error('Assertion Failed: Vendor Owner must be level 2');
  if (warehouseMgrLvl !== 3) throw new Error('Assertion Failed: Warehouse Manager must be level 3');
  if (deliveryLvl !== 5) throw new Error('Assertion Failed: Delivery Agent must be level 5');
  if (userLvl !== 6) throw new Error('Assertion Failed: Customer User must be level 6');
  console.log('✅ Role levels check out correctly!');

  // 2. Role Assignment Asserts
  console.log('\n[2/3] Verifying assignment hierarchy permissions...');
  
  const mockSystemOwner = { role: 'admin', isSuperAdmin: true };
  const mockOrgOwner = { role: 'vendor_owner', isSuperAdmin: false };
  const mockWarehouseMgr = { role: 'warehouse_manager', isSuperAdmin: false };
  const mockDeliveryAgent = { role: 'delivery_agent', isSuperAdmin: false };

  // System owner can assign anyone
  if (!canAssignRole(mockSystemOwner, 'platform_admin')) throw new Error('System owner should be able to assign platform_admin');
  if (!canAssignRole(mockSystemOwner, 'delivery_agent')) throw new Error('System owner should be able to assign delivery_agent');

  // Org owner can assign vendor_staff
  if (!canAssignRole(mockOrgOwner, 'vendor_staff')) throw new Error('Org owner should be able to assign vendor_staff');
  // Org owner CANNOT assign admin
  if (canAssignRole(mockOrgOwner, 'admin')) throw new Error('Org owner should NOT be able to assign admin');
  if (canAssignRole(mockOrgOwner, 'platform_admin')) throw new Error('Org owner should NOT be able to assign platform_admin');

  // Warehouse manager can assign warehouse staff
  if (!canAssignRole(mockWarehouseMgr, 'warehouse_staff')) throw new Error('Warehouse manager should be able to assign warehouse_staff');
  // Warehouse manager CANNOT assign vendor_owner
  if (canAssignRole(mockWarehouseMgr, 'vendor_owner')) throw new Error('Warehouse manager should NOT be able to assign vendor_owner');

  // Delivery agent cannot assign anyone
  if (canAssignRole(mockDeliveryAgent, 'delivery_boy')) throw new Error('Delivery agent should NOT be able to assign anyone');
  console.log('✅ Role assignment hierarchy rules enforced correctly!');

  // 3. Multi-Tenant Query Scoping Asserts
  console.log('\n[3/3] Verifying multi-tenant database query isolation...');

  const orgId1 = new mongoose.Types.ObjectId();
  const orgId2 = new mongoose.Types.ObjectId();

  const mockAdminUser = {
    role: 'admin',
    isSuperAdmin: true
  };

  const mockVendorStaff = {
    role: 'vendor_staff',
    isSuperAdmin: false,
    organizationId: orgId1
  };

  // Scope query for admin
  const baseQuery = { category: 'Organic' };
  const adminScope = scopeQueryForActor(mockAdminUser, { ...baseQuery });
  console.log('  Admin query scope:', JSON.stringify(adminScope));
  if (adminScope.organization || adminScope.tenantId) {
    throw new Error('Assertion Failed: Global admin query should not be restricted by organization/tenant');
  }

  // Scope query for vendor staff
  const staffScope = scopeQueryForActor(mockVendorStaff, { ...baseQuery });
  console.log('  Vendor Staff query scope:', JSON.stringify(staffScope));
  if (staffScope.organization?.toString() !== orgId1.toString() || staffScope.tenantId?.toString() !== orgId1.toString()) {
    throw new Error('Assertion Failed: Vendor staff query must be restricted to their organizationId');
  }

  console.log('✅ Multi-tenant isolation query scoping verified successfully!');
  console.log('\n🏆 ALL RBAC & ISOLATION PIPELINE TESTS PASSED!');
  process.exit(0);

} catch (error) {
  console.error('❌ RBAC Isolation Verification Failed:', error.message);
  process.exit(1);
}
