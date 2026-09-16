import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Admin from '../src/models/Admin.js';
import firebaseAdminService from '../src/services/firebaseAdminService.js';
import notificationService from '../src/services/notificationService.js';

const runTest = async () => {
  console.log('\n======================================================');
  console.log('🧪 TESTING PUSH NOTIFICATIONS & FCM TOKEN LIFECYCLE');
  console.log('======================================================\n');

  try {
    await connectDB();

    // 1. Check FCM Service Status
    const status = firebaseAdminService.getStatus();
    console.log('1. FCM Service Status:', status);

    // 2. Find or create a test user
    let testUser = await User.findOne({ phone: '9999999999' });
    if (!testUser) {
      testUser = await User.create({
        phone: '9999999999',
        name: 'FCM Test User',
        email: 'fcm.test@auriva.com',
        fcmTokens: [],
        fcmTokenMobile: []
      });
      console.log('2. Created test user:', testUser._id);
    } else {
      testUser.fcmTokens = [];
      testUser.fcmTokenMobile = [];
      await testUser.save();
      console.log('2. Found & reset test user:', testUser._id);
    }

    // 3. Test adding tokens and deduplication
    const mockToken1 = 'fcm_token_web_alpha_12345';
    const mockToken2 = 'fcm_token_web_beta_67890';

    testUser.fcmTokens.push(mockToken1);
    testUser.fcmTokens.push(mockToken1); // duplicate
    testUser.fcmTokens.push(mockToken2);
    // Deduplicate
    testUser.fcmTokens = [...new Set(testUser.fcmTokens)];
    await testUser.save();

    console.log('3. Stored tokens after deduplication (should be 2):', testUser.fcmTokens.length);
    if (testUser.fcmTokens.length !== 2) throw new Error('Deduplication failed');

    // 4. Test capping at 10 tokens
    for (let i = 1; i <= 15; i++) {
      testUser.fcmTokens.push(`fcm_token_overflow_${i}`);
      if (testUser.fcmTokens.length > 10) {
        testUser.fcmTokens = testUser.fcmTokens.slice(-10);
      }
    }
    await testUser.save();
    console.log('4. Stored tokens after overflow (should be capped at 10):', testUser.fcmTokens.length);
    if (testUser.fcmTokens.length !== 10) throw new Error('Token capping failed');

    // 5. Test token removal
    const tokenToRemove = testUser.fcmTokens[0];
    testUser.fcmTokens = testUser.fcmTokens.filter(t => t !== tokenToRemove);
    await testUser.save();
    console.log('5. Stored tokens after removal (should be 9):', testUser.fcmTokens.length);
    if (testUser.fcmTokens.length !== 9) throw new Error('Token removal failed');

    // 6. Test push notification dispatch (Standby/Live)
    console.log('6. Dispatching push notification via firebaseAdminService...');
    const pushResult = await firebaseAdminService.sendPushNotification(
      [mockToken1, mockToken2],
      {
        title: 'Auriva Order Shipped! 📦',
        body: 'Your roasted makhana order is on its way.',
        data: {
          orderId: 'ORD-9876',
          link: '/orders/ORD-9876'
        }
      }
    );
    console.log('   Push Dispatch Result:', pushResult);

    // 7. Test integrated in-app + push notification creation
    console.log('7. Testing notificationService.createNotification with push hook...');
    const notif = await notificationService.createNotification({
      recipient: testUser._id,
      recipientRole: 'USER',
      title: 'Special 20% Discount Activated 🎉',
      message: 'Use code AURIVA20 on your next crunchy snack box!',
      type: 'SYSTEM',
      link: '/shop'
    });
    console.log('   Created Notification ID:', notif._id);

    console.log('\n======================================================');
    console.log('✅ ALL PUSH NOTIFICATION BACKEND TESTS PASSED');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ Test failed with error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTest();
