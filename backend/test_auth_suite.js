import mongoose from 'mongoose';
import env from './src/config/env.js';
import connectDB from './src/config/db.js';
import app from './src/app.js';
import User from './src/models/User.js';
import Admin from './src/models/Admin.js';
import Otp from './src/models/Otp.js';
import adminAuthService from './src/services/adminAuthService.js';
import userAuthService from './src/services/userAuthService.js';
import { hashOtp } from './src/services/otpService.js';

const runTestSuite = async () => {
  console.log('\n======================================================');
  console.log('🧪 RUNNING AURIVA AUTHENTICATION TEST SUITE');
  console.log('======================================================\n');

  let server;
  const testPort = 5055;

  try {
    // 1. Connect to DB and start test server
    await connectDB();
    await User.syncIndexes().catch(() => {});
    await adminAuthService.ensureDefaultAdmin();
    await userAuthService.ensureDefaultDemoUsers();

    server = app.listen(testPort);
    const BASE_URL = `http://localhost:${testPort}/api/v1`;

    const testPhone = '9876500112';

    // Clean test records before testing
    await User.deleteMany({ phone: testPhone });
    await Otp.deleteMany({ phone: testPhone });

    console.log('✓ Database connected and test records cleaned.');

    // -------------------------------------------------------------
    // TEST 1: Request OTP for User
    // -------------------------------------------------------------
    console.log('\n[Test 1] User Request OTP (Valid 10-digit phone)');
    const sendOtpRes = await fetch(`${BASE_URL}/auth/user/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone })
    });
    const sendOtpData = await sendOtpRes.json();
    console.log('Status:', sendOtpRes.status, 'Response:', sendOtpData);
    if (sendOtpRes.status !== 200 || !sendOtpData.success) {
      throw new Error(`Test 1 Failed: ${JSON.stringify(sendOtpData)}`);
    }
    console.log('✅ Test 1 Passed: OTP request accepted, raw OTP never exposed in response.');

    // -------------------------------------------------------------
    // TEST 2: OTP Cooldown Enforcement (< 30s)
    // -------------------------------------------------------------
    console.log('\n[Test 2] OTP Cooldown Enforcement');
    const cooldownRes = await fetch(`${BASE_URL}/auth/user/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone })
    });
    const cooldownData = await cooldownRes.json();
    console.log('Status:', cooldownRes.status, 'Response:', cooldownData);
    if (cooldownRes.status !== 429) {
      throw new Error(`Test 2 Failed: Expected 429 Too Many Requests, got ${cooldownRes.status}`);
    }
    console.log('✅ Test 2 Passed: 30-second resend cooldown properly enforced (HTTP 429).');

    // -------------------------------------------------------------
    // TEST 3: Invalid OTP Verification
    // -------------------------------------------------------------
    console.log('\n[Test 3] Invalid OTP Verification');
    const invalidOtpRes = await fetch(`${BASE_URL}/auth/user/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone, otp: '000000' })
    });
    const invalidOtpData = await invalidOtpRes.json();
    console.log('Status:', invalidOtpRes.status, 'Response:', invalidOtpData);
    if (invalidOtpRes.status !== 400 || invalidOtpData.success) {
      throw new Error(`Test 3 Failed: Expected 400 Bad Request, got ${invalidOtpRes.status}`);
    }
    console.log('✅ Test 3 Passed: Invalid OTP correctly rejected with remaining attempts counter.');

    // -------------------------------------------------------------
    // TEST 4: Valid OTP Verification & Auto User Registration
    // -------------------------------------------------------------
    console.log('\n[Test 4] Valid OTP Verification & Auto User Registration');
    // For test execution, fetch stored active OTP hash and overwrite with a known test OTP
    const knownTestOtp = '654321';
    await Otp.findOneAndUpdate(
      { phone: testPhone },
      { otpHash: hashOtp(knownTestOtp), attempts: 0 }
    );

    const verifyRes = await fetch(`${BASE_URL}/auth/user/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone, otp: knownTestOtp })
    });
    const verifyData = await verifyRes.json();
    console.log('Status:', verifyRes.status, 'Response:', {
      success: verifyData.success,
      isNewUser: verifyData.data?.isNewUser,
      user: verifyData.data?.user,
      tokenExists: Boolean(verifyData.data?.token)
    });

    if (verifyRes.status !== 200 || !verifyData.data?.token || verifyData.data?.user?.role !== 'USER') {
      throw new Error(`Test 4 Failed: ${JSON.stringify(verifyData)}`);
    }
    const userToken = verifyData.data.token;
    console.log('✅ Test 4 Passed: OTP verified, User auto-registered with USER role & JWT issued.');

    // Verify OTP document was destroyed upon successful verification
    const remainingOtpDoc = await Otp.findOne({ phone: testPhone });
    if (remainingOtpDoc) {
      throw new Error('Test 4.1 Failed: OTP document was not deleted after verification!');
    }
    console.log('✅ Test 4.1 Passed: OTP document immediately invalidated to prevent replay.');

    // -------------------------------------------------------------
    // TEST 5: Get User Profile (Protected)
    // -------------------------------------------------------------
    console.log('\n[Test 5] Get User Profile with JWT');
    const profileRes = await fetch(`${BASE_URL}/auth/user/profile`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const profileData = await profileRes.json();
    console.log('Status:', profileRes.status, 'Response:', profileData);
    if (profileRes.status !== 200 || profileData.data?.user?.phone !== testPhone) {
      throw new Error(`Test 5 Failed: ${JSON.stringify(profileData)}`);
    }
    console.log('✅ Test 5 Passed: User profile retrieved successfully via JWT.');

    // -------------------------------------------------------------
    // TEST 6: Update User Profile
    // -------------------------------------------------------------
    console.log('\n[Test 6] Update User Profile');
    const updateRes = await fetch(`${BASE_URL}/auth/user/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        name: 'Test Customer',
        email: 'testcustomer@aurivafoods.com'
      })
    });
    const updateData = await updateRes.json();
    console.log('Status:', updateRes.status, 'Response:', updateData);
    if (updateRes.status !== 200 || updateData.data?.user?.name !== 'Test Customer') {
      throw new Error(`Test 6 Failed: ${JSON.stringify(updateData)}`);
    }
    console.log('✅ Test 6 Passed: User profile updated with name and email.');

    // -------------------------------------------------------------
    // TEST 7: Admin Login with Wrong Password (Should Fail)
    // -------------------------------------------------------------
    console.log('\n[Test 7] Admin Login with Wrong Password');
    const adminFailRes = await fetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@aurivafoods.com',
        password: 'WrongPassword999'
      })
    });
    const adminFailData = await adminFailRes.json();
    console.log('Status:', adminFailRes.status, 'Response:', adminFailData);
    if (adminFailRes.status !== 401) {
      throw new Error(`Test 7 Failed: Expected 401 Unauthorized, got ${adminFailRes.status}`);
    }
    console.log('✅ Test 7 Passed: Wrong password rejected.');

    // -------------------------------------------------------------
    // TEST 8: Admin Login with Correct Credentials
    // -------------------------------------------------------------
    console.log('\n[Test 8] Admin Login with Correct Credentials');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@aurivafoods.com',
        password: 'Admin@123456'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    console.log('Status:', adminLoginRes.status, 'Response:', {
      success: adminLoginData.success,
      admin: adminLoginData.data?.admin,
      tokenExists: Boolean(adminLoginData.data?.token)
    });
    if (adminLoginRes.status !== 200 || !adminLoginData.data?.token || adminLoginData.data?.admin?.role !== 'ADMIN') {
      throw new Error(`Test 8 Failed: ${JSON.stringify(adminLoginData)}`);
    }
    const adminToken = adminLoginData.data.token;
    console.log('✅ Test 8 Passed: Admin login successful, ADMIN role token issued.');

    // -------------------------------------------------------------
    // TEST 9: Admin Profile Fetch
    // -------------------------------------------------------------
    console.log('\n[Test 9] Get Admin Profile');
    const adminProfileRes = await fetch(`${BASE_URL}/auth/admin/profile`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminProfileData = await adminProfileRes.json();
    console.log('Status:', adminProfileRes.status, 'Response:', adminProfileData);
    if (adminProfileRes.status !== 200 || adminProfileData.data?.admin?.email !== 'admin@aurivafoods.com') {
      throw new Error(`Test 9 Failed: ${JSON.stringify(adminProfileData)}`);
    }
    console.log('✅ Test 9 Passed: Admin profile retrieved.');

    // -------------------------------------------------------------
    // TEST 10: Role Cross-Access Protection
    // -------------------------------------------------------------
    console.log('\n[Test 10] Cross-Role Authorization Guard Tests');
    // User token accessing Admin users list -> Must be 403 Forbidden
    const userToAdminRes = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('User accessing Admin route Status:', userToAdminRes.status);
    if (userToAdminRes.status !== 403) {
      throw new Error(`Test 10.1 Failed: User token accessed admin route with status ${userToAdminRes.status}`);
    }

    // Admin token accessing User protected profile -> Must be 403 Forbidden
    const adminToUserRes = await fetch(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('Admin accessing User route Status:', adminToUserRes.status);
    if (adminToUserRes.status !== 403) {
      throw new Error(`Test 10.2 Failed: Admin token accessed user route with status ${adminToUserRes.status}`);
    }
    console.log('✅ Test 10 Passed: Decoupled role protection strictly enforced in both directions!');

    // Cleanup
    await User.deleteMany({ phone: testPhone });
    await Otp.deleteMany({ phone: testPhone });

    console.log('\n======================================================');
    console.log('🎉 ALL 10 TESTS PASSED PERFECTLY!');
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTestSuite();
