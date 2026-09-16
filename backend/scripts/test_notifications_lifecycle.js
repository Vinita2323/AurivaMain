import assert from 'assert';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Admin from '../src/models/Admin.js';
import Product from '../src/models/Product.js';
import Address from '../src/models/Address.js';
import Order from '../src/models/Order.js';
import Cart from '../src/models/Cart.js';
import Notification from '../src/models/Notification.js';
import notificationService from '../src/services/notificationService.js';
import * as orderService from '../src/services/orderService.js';
import adminAuthService from '../src/services/adminAuthService.js';
import { generateToken } from '../src/utils/generateToken.js';
import { ROLES } from '../src/constants/roles.js';

const runNotificationSuite = async () => {
  console.log('================================================================');
  console.log('🧪 Starting Phase 6 — In-App Notification System Test Suite');
  console.log('================================================================\n');

  await connectDB();

  let server;
  const testPort = 5059;
  server = app.listen(testPort);
  const BASE_URL = `http://localhost:${testPort}/api/v1`;

  const timestamp = Date.now();

  try {
    // -------------------------------------------------------------
    // SETUP: Create Test Fixtures (Customer, Admin, Product, Address)
    // -------------------------------------------------------------
    console.log('🔹 Setup: Initializing test customer, admin, and product...');
    const testUser = await User.create({
      phone: `91122${timestamp.toString().slice(-5)}`,
      name: 'Notification Test User',
      email: `notif_${timestamp}@aurivatest.com`,
      role: 'USER',
      isVerified: true
    });

    const testAdmin = await Admin.findOne({ email: 'admin@aurivafoods.com' }) ||
      await Admin.create({
        name: 'Super Admin',
        email: `admin_${timestamp}@aurivafoods.com`,
        password: 'Admin@Password123',
        role: 'ADMIN',
        status: 'ACTIVE'
      });

    const userToken = generateToken({ id: testUser._id, role: ROLES.USER });
    const adminToken = generateToken({ id: testAdmin._id, role: ROLES.ADMIN });

    const testProduct = await Product.create({
      name: `Crunchy Foxnuts ${timestamp}`,
      slug: `crunchy-foxnuts-${timestamp}`,
      price: 199,
      oldPrice: 249,
      stockCount: 50,
      inStock: true,
      category: 'flavoured-makhana',
      image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087'
    });

    const testAddress = await Address.create({
      user: testUser._id,
      fullName: 'Vini Sharma',
      phoneNumber: '9876543210',
      addressLine1: 'Plot 42, Silicon City',
      city: 'Indore',
      state: 'Madhya Pradesh',
      postalCode: '452012'
    });

    console.log('  ✅ [PASS] Fixtures initialized successfully.\n');

    // -------------------------------------------------------------
    // TEST 1: Direct Service Creation & Model Relative Time
    // -------------------------------------------------------------
    console.log('🔹 Test 1: Notification Model Creation & Schema Verification');
    const createdNotif = await notificationService.createNotification({
      recipient: testUser._id,
      recipientRole: 'USER',
      title: 'Welcome to Auriva!',
      message: 'Your account is ready. Explore our premium roasted snacks.',
      type: 'SYSTEM',
      link: '/shop'
    });

    assert(createdNotif._id, 'Notification must have MongoDB ID');
    assert.strictEqual(createdNotif.read, false, 'Notification must default to read=false');
    const notifJson = createdNotif.toJSON();
    assert.strictEqual(notifJson.description, createdNotif.message, 'toJSON should alias description');
    assert.strictEqual(notifJson.time, 'Just now', 'Recent notification should report "Just now"');
    console.log('  ✅ [PASS] Direct notification created with valid schema and relative time formatting');

    // -------------------------------------------------------------
    // TEST 2: Low-Stock Event Trigger & Deduplication Guard
    // -------------------------------------------------------------
    console.log('\n🔹 Test 2: Low-Stock Automatic Notification & Deduplication');
    const lowStockProd = await Product.create({
      name: `Low Stock Foxnuts ${timestamp}`,
      slug: `low-stock-foxnuts-${timestamp}`,
      price: 220,
      stockCount: 15, // <= default threshold 30
      inStock: true,
      category: 'flavoured-makhana',
      image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087'
    });

    const lowStockAlert1 = await notificationService.checkAndNotifyLowStock(lowStockProd);
    assert(lowStockAlert1, 'Low stock notification must be created');
    assert.strictEqual(lowStockAlert1.type, 'LOW_STOCK', 'Type must be LOW_STOCK');
    assert.strictEqual(lowStockAlert1.recipientRole, 'ADMIN', 'Must be addressed to ADMIN');
    assert(lowStockAlert1.title.includes('Low Stock Warning'), 'Title should indicate warning');
    console.log('  ✅ [PASS] Low stock alert created for Admin when stock <= threshold');

    // Test deduplication
    const lowStockAlert2 = await notificationService.checkAndNotifyLowStock(lowStockProd);
    assert.strictEqual(
      lowStockAlert1._id.toString(),
      lowStockAlert2._id.toString(),
      'Should return existing unread notification to prevent notification flooding'
    );
    console.log('  ✅ [PASS] Deduplication guard prevents redundant spam for identical unread low-stock items');

    // -------------------------------------------------------------
    // TEST 3: Order Placement Hook (Admin & User Notifications)
    // -------------------------------------------------------------
    console.log('\n🔹 Test 3: Order Placement Triggers Admin & Customer Notifications');
    await Cart.findOneAndUpdate(
      { user: testUser._id },
      {
        $set: {
          items: [{ product: testProduct._id, name: testProduct.name, price: testProduct.price, qty: 2 }]
        }
      },
      { upsert: true }
    );

    const placedOrder = await orderService.placeOrder(testUser._id, {
      addressId: testAddress._id,
      paymentMethod: 'COD'
    });

    // Check Admin notification for new order
    const adminOrderNotif = await Notification.findOne({
      recipientRole: 'ADMIN',
      type: 'ORDER_PLACED',
      relatedId: placedOrder._id.toString()
    });
    assert(adminOrderNotif, 'Admin must receive ORDER_PLACED notification');
    assert(adminOrderNotif.title.includes(placedOrder.orderNumber), 'Title should include order number');
    console.log('  ✅ [PASS] Admin received ORDER_PLACED notification for #' + placedOrder.orderNumber);

    // Check User notification for order confirmation
    const userOrderNotif = await Notification.findOne({
      recipient: testUser._id,
      recipientRole: 'USER',
      type: 'ORDER_CONFIRMED',
      relatedId: placedOrder._id.toString()
    });
    assert(userOrderNotif, 'Customer must receive ORDER_CONFIRMED notification');
    assert(userOrderNotif.message.includes(placedOrder.orderNumber), 'Message should reference order number');
    console.log('  ✅ [PASS] Customer received ORDER_CONFIRMED notification for #' + placedOrder.orderNumber);

    // -------------------------------------------------------------
    // TEST 4: Status Transitions (PACKED, SHIPPED, DELIVERED)
    // -------------------------------------------------------------
    console.log('\n🔹 Test 4: Order Status Transition Notifications');
    // Step 1: CONFIRMED -> PACKED
    await orderService.updateOrderStatusAdmin(placedOrder._id, 'PACKED');
    const packedNotif = await Notification.findOne({
      recipient: testUser._id,
      type: 'ORDER_PACKED',
      relatedId: placedOrder._id.toString()
    });
    assert(packedNotif, 'Customer should receive ORDER_PACKED notification');
    console.log('  ✅ [PASS] Customer received ORDER_PACKED notification');

    // Step 2: Dispatch Order -> SHIPPED
    await orderService.dispatchOrderAdmin(placedOrder._id, {
      courierName: 'Delhivery Express',
      awbNumber: 'DLHV99887766'
    });
    const shippedNotif = await Notification.findOne({
      recipient: testUser._id,
      type: 'ORDER_SHIPPED',
      relatedId: placedOrder._id.toString()
    });
    assert(shippedNotif, 'Customer should receive ORDER_SHIPPED notification');
    assert(shippedNotif.message.includes('Delhivery Express'), 'Message should reference courier name');
    console.log('  ✅ [PASS] Customer received ORDER_SHIPPED notification with AWB tracking details');

    // Step 3: SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED
    await orderService.updateOrderStatusAdmin(placedOrder._id, 'OUT_FOR_DELIVERY');
    const outForDeliveryNotif = await Notification.findOne({
      recipient: testUser._id,
      type: 'ORDER_OUT_FOR_DELIVERY',
      relatedId: placedOrder._id.toString()
    });
    assert(outForDeliveryNotif, 'Customer should receive ORDER_OUT_FOR_DELIVERY notification');
    console.log('  ✅ [PASS] Customer received ORDER_OUT_FOR_DELIVERY notification');

    await orderService.updateOrderStatusAdmin(placedOrder._id, 'DELIVERED');
    const deliveredNotif = await Notification.findOne({
      recipient: testUser._id,
      type: 'ORDER_DELIVERED',
      relatedId: placedOrder._id.toString()
    });
    assert(deliveredNotif, 'Customer should receive ORDER_DELIVERED notification');
    console.log('  ✅ [PASS] Customer received ORDER_DELIVERED notification');

    // -------------------------------------------------------------
    // TEST 5: Order Cancellation Notifications
    // -------------------------------------------------------------
    console.log('\n🔹 Test 5: Order Cancellation Notifications');
    // Create a new order to test cancellation
    await Cart.findOneAndUpdate(
      { user: testUser._id },
      {
        $set: {
          items: [{ product: testProduct._id, name: testProduct.name, price: testProduct.price, qty: 1 }]
        }
      },
      { upsert: true }
    );
    const cancelOrderTest = await orderService.placeOrder(testUser._id, {
      addressId: testAddress._id,
      paymentMethod: 'COD'
    });

    await orderService.cancelOrder(cancelOrderTest._id, {
      cancelledBy: 'CUSTOMER',
      cancelReason: 'Placed by mistake',
      userId: testUser._id,
      isAdmin: false
    });

    const adminCancelNotif = await Notification.findOne({
      recipientRole: 'ADMIN',
      type: 'ORDER_CANCELLED',
      relatedId: cancelOrderTest._id.toString()
    });
    assert(adminCancelNotif, 'Admin should receive cancellation notification');
    assert(adminCancelNotif.message.includes('Placed by mistake'), 'Reason should be included in alert');
    console.log('  ✅ [PASS] Admin received ORDER_CANCELLED alert with reason');

    const userCancelNotif = await Notification.findOne({
      recipient: testUser._id,
      type: 'ORDER_CANCELLED',
      relatedId: cancelOrderTest._id.toString()
    });
    assert(userCancelNotif, 'Customer should receive cancellation confirmation');
    console.log('  ✅ [PASS] Customer received ORDER_CANCELLED notification');

    // -------------------------------------------------------------
    // TEST 6: Admin REST APIs
    // -------------------------------------------------------------
    console.log('\n🔹 Test 6: Admin Notification REST APIs (List, Unread Count, Mark Read, Delete)');

    // 6.1 GET /admin/notifications
    const adminListRes = await fetch(`${BASE_URL}/admin/notifications`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminListData = await adminListRes.json();
    assert.strictEqual(adminListRes.status, 200, 'GET /admin/notifications should return 200');
    assert(Array.isArray(adminListData.data?.notifications), 'Should return notifications array');
    assert(adminListData.data?.notifications.length > 0, 'Should contain admin notifications');
    console.log(`  ✅ [PASS] GET /admin/notifications returned ${adminListData.data.notifications.length} notification(s)`);

    // 6.2 GET /admin/notifications/unread-count
    const adminCountRes = await fetch(`${BASE_URL}/admin/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminCountData = await adminCountRes.json();
    assert.strictEqual(adminCountRes.status, 200);
    assert(typeof adminCountData.data?.unreadCount === 'number');
    const initialAdminUnread = adminCountData.data.unreadCount;
    console.log(`  ✅ [PASS] GET /admin/notifications/unread-count returned ${initialAdminUnread}`);

    // 6.3 PATCH /admin/notifications/:id/read
    const targetAdminNotif = adminListData.data.notifications.find(n => !n.read);
    assert(targetAdminNotif, 'Should find at least one unread admin notification');

    const markReadRes = await fetch(`${BASE_URL}/admin/notifications/${targetAdminNotif._id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const markReadData = await markReadRes.json();
    assert.strictEqual(markReadRes.status, 200);
    assert.strictEqual(markReadData.data?.notification?.read, true, 'read flag must be updated to true');
    console.log('  ✅ [PASS] PATCH /admin/notifications/:id/read marked notification as read');

    // 6.4 PATCH /admin/notifications/read-all
    const markAllRes = await fetch(`${BASE_URL}/admin/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const markAllData = await markAllRes.json();
    assert.strictEqual(markAllRes.status, 200);

    const postMarkCountRes = await fetch(`${BASE_URL}/admin/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const postMarkCountData = await postMarkCountRes.json();
    assert.strictEqual(postMarkCountData.data?.unreadCount, 0, 'All admin notifications should now be read');
    console.log('  ✅ [PASS] PATCH /admin/notifications/read-all reset unread count to 0');

    // 6.5 DELETE /admin/notifications/:id
    const deleteRes = await fetch(`${BASE_URL}/admin/notifications/${targetAdminNotif._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(deleteRes.status, 200);
    const deletedCheck = await Notification.findById(targetAdminNotif._id);
    assert.strictEqual(deletedCheck, null, 'Deleted notification should not exist in database');
    console.log('  ✅ [PASS] DELETE /admin/notifications/:id removed notification from database');

    // -------------------------------------------------------------
    // TEST 7: Customer REST APIs & Strict Role Isolation
    // -------------------------------------------------------------
    console.log('\n🔹 Test 7: Customer REST APIs & Strict RBAC Protection');

    // 7.1 Customer accessing admin route -> 403 Forbidden
    const rbacForbiddenRes = await fetch(`${BASE_URL}/admin/notifications`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.strictEqual(rbacForbiddenRes.status, 403, 'Customer should be blocked from admin route with 403');
    console.log('  ✅ [PASS] Customer role strictly blocked from /admin/notifications (HTTP 403)');

    // 7.2 Customer accessing own route -> 200 OK
    const userListRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const userListData = await userListRes.json();
    assert.strictEqual(userListRes.status, 200);
    assert(Array.isArray(userListData.data?.notifications), 'Should return user notifications');
    // Ensure no admin notifications leaked to customer
    const leakedAdminNotifs = userListData.data.notifications.filter(n => n.recipientRole === 'ADMIN');
    assert.strictEqual(leakedAdminNotifs.length, 0, 'No admin notifications should leak to customer');
    console.log(`  ✅ [PASS] Customer retrieved ${userListData.data.notifications.length} own notification(s) with 0 role leakages`);

    // 7.3 Customer unread count
    const userCountRes = await fetch(`${BASE_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const userCountData = await userCountRes.json();
    assert.strictEqual(userCountRes.status, 200);
    assert(typeof userCountData.data?.unreadCount === 'number');
    console.log(`  ✅ [PASS] Customer unread count retrieved: ${userCountData.data.unreadCount}`);

    // 7.4 Customer mark all as read
    const userMarkAllRes = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.strictEqual(userMarkAllRes.status, 200);

    const postUserCountRes = await fetch(`${BASE_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const postUserCountData = await postUserCountRes.json();
    assert.strictEqual(postUserCountData.data?.unreadCount, 0, 'Customer unread count should be 0');
    console.log('  ✅ [PASS] Customer mark-all-read reset customer unread count to 0');

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log('\n🔹 Cleanup: Cleaning test records...');
    await Notification.deleteMany({
      $or: [
        { recipient: testUser._id },
        { relatedId: placedOrder._id.toString() },
        { relatedId: cancelOrderTest._id.toString() },
        { 'metadata.productId': lowStockProd._id.toString() }
      ]
    });
    await Order.deleteMany({ _id: { $in: [placedOrder._id, cancelOrderTest._id] } });
    await Address.deleteOne({ _id: testAddress._id });
    await Product.deleteMany({ _id: { $in: [testProduct._id, lowStockProd._id] } });
    await User.deleteOne({ _id: testUser._id });
    if (testAdmin.email.includes(timestamp.toString())) {
      await Admin.deleteOne({ _id: testAdmin._id });
    }
    console.log('  ✅ [PASS] Test records cleaned up successfully.');

    console.log('\n================================================================');
    console.log('🎉 ALL NOTIFICATION LIFECYCLE TESTS PASSED!');
    console.log('================================================================\n');

    server.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Notification Test Suite Failed:', error);
    if (server) server.close();
    process.exit(1);
  }
};

runNotificationSuite();
