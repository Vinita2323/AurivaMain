import assert from 'assert';
import crypto from 'crypto';
import connectDB from '../src/config/db.js';
import env from '../src/config/env.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Address from '../src/models/Address.js';
import Order from '../src/models/Order.js';
import Payment from '../src/models/Payment.js';
import Cart from '../src/models/Cart.js';
import PaymentService from '../src/services/paymentService.js';
import * as orderService from '../src/services/orderService.js';
import {
  getRazorpayInstance,
  isRazorpayConfigured,
  getPublicRazorpayKey,
  verifyPaymentSignature
} from '../src/config/razorpay.js';

const testLiveRazorpay = async () => {
  console.log('================================================================');
  console.log('🧪 Verifying Live Razorpay Test Credentials Integration');
  console.log('================================================================\n');

  await connectDB();

  try {
    // 1. Check Configuration flags
    console.log('🔹 Step 1: Validating Environment & Configuration');
    assert.strictEqual(isRazorpayConfigured(), true, 'isRazorpayConfigured should be true');
    const publicKey = getPublicRazorpayKey();
    assert.strictEqual(publicKey, 'rzp_test_TRZdg2aAOYv4KK', 'Public key must match Key ID');
    console.log('  ✅ [PASS] Configuration detected and public key matches:', publicKey);

    const config = PaymentService.getPaymentConfig();
    assert.strictEqual(config.isConfigured, true, 'Config endpoint reports isConfigured=true');
    assert.strictEqual(config.keyId, 'rzp_test_TRZdg2aAOYv4KK', 'Config endpoint returns keyId');
    console.log('  ✅ [PASS] PaymentService.getPaymentConfig() returns isConfigured=true');

    // 2. Direct API call to Razorpay to verify credentials with Razorpay servers
    console.log('\n🔹 Step 2: Testing direct API call to Razorpay server');
    const rzp = getRazorpayInstance();
    assert(rzp, 'Razorpay client instance must exist');

    const testRzpOrder = await rzp.orders.create({
      amount: 49900, // ₹499 in paise
      currency: 'INR',
      receipt: `test_rcp_${Date.now()}`,
      notes: { test: 'live_credential_validation' }
    });

    assert(testRzpOrder && testRzpOrder.id, 'Razorpay must return an order object with an ID');
    assert(testRzpOrder.id.startsWith('order_'), 'Razorpay order ID should start with order_');
    assert.strictEqual(testRzpOrder.amount, 49900, 'Order amount in paise should match 49900');
    console.log('  ✅ [PASS] Successfully connected to Razorpay server!');
    console.log('     Razorpay Order ID Created:', testRzpOrder.id);
    console.log('     Amount:', testRzpOrder.amount, testRzpOrder.currency);

    // 3. Test createPaymentOrder end-to-end with real database Order
    console.log('\n🔹 Step 3: Testing end-to-end createPaymentOrder with database Order');
    const timestamp = Date.now();
    const testUser = await User.create({
      phone: `99887${timestamp.toString().slice(-5)}`,
      name: 'Live RZP Customer',
      email: `rzpcust_${timestamp}@aurivatest.com`,
      role: 'USER',
      isVerified: true
    });

    const testProd = await Product.create({
      name: `Live Test Makhana ${timestamp}`,
      slug: `live-test-makhana-${timestamp}`,
      price: 299,
      originalPrice: 350,
      stockCount: 20,
      inStock: true,
      category: 'Snacks',
      description: 'Live test item',
      image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087'
    });

    const testAddr = await Address.create({
      user: testUser._id,
      fullName: 'Live Test Customer',
      phoneNumber: '9988776655',
      addressLine1: 'Test Address 123',
      city: 'Indore',
      state: 'Madhya Pradesh',
      postalCode: '452001'
    });

    await Cart.findOneAndUpdate(
      { user: testUser._id },
      {
        $set: {
          items: [
            {
              product: testProd._id,
              name: testProd.name,
              price: testProd.price,
              weight: '150g',
              qty: 1
            }
          ]
        }
      },
      { upsert: true }
    );

    const dbOrder = await orderService.placeOrder(testUser._id, {
      addressId: testAddr._id,
      paymentMethod: 'UPI'
    });

    console.log('     DB Order created:', dbOrder.orderNumber, 'Total: ₹' + dbOrder.pricing.total);

    // Now call PaymentService.createPaymentOrder
    const paymentSession = await PaymentService.createPaymentOrder(testUser._id, {
      orderId: dbOrder._id.toString()
    });

    assert(paymentSession.success, 'Payment order creation should succeed');
    assert(paymentSession.razorpayOrderId.startsWith('order_'), 'Must return real Razorpay order ID');
    assert.strictEqual(paymentSession.keyId, 'rzp_test_TRZdg2aAOYv4KK', 'Returned keyId must match');
    assert.strictEqual(paymentSession.amount, Math.round(dbOrder.pricing.total * 100), 'Amount in paise must match');
    console.log('  ✅ [PASS] PaymentService.createPaymentOrder returned live Razorpay order:', paymentSession.razorpayOrderId);

    // 4. Test Payment Verification with genuine signature calculation
    console.log('\n🔹 Step 4: Testing signature verification with configured secret');
    const mockPaymentId = `pay_TEST_${Date.now()}`;
    const generatedSignature = crypto
      .createHmac('sha256', env.RAZORPAY.KEY_SECRET)
      .update(`${paymentSession.razorpayOrderId}|${mockPaymentId}`)
      .digest('hex');

    const verifyResult = await PaymentService.verifyPayment(testUser._id, {
      orderId: dbOrder._id.toString(),
      razorpayOrderId: paymentSession.razorpayOrderId,
      razorpayPaymentId: mockPaymentId,
      razorpaySignature: generatedSignature
    });

    assert.strictEqual(verifyResult.success, true, 'Verification must succeed');
    assert.strictEqual(verifyResult.order.payment.status, 'PAID', 'Order payment status updated to PAID');
    assert.strictEqual(verifyResult.payment.status, 'PAID', 'Payment record updated to PAID');
    console.log('  ✅ [PASS] Payment signature verified and status updated to PAID');

    // Clean up test data
    await User.deleteOne({ _id: testUser._id });
    await Product.deleteOne({ _id: testProd._id });
    await Address.deleteOne({ _id: testAddr._id });
    await Order.deleteOne({ _id: dbOrder._id });
    await Payment.deleteMany({ order: dbOrder._id });

    console.log('\n================================================================');
    console.log('🎉 ALL LIVE RAZORPAY CREDENTIAL TESTS PASSED!');
    console.log('================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Live Razorpay Test Failed:', err);
    process.exit(1);
  }
};

testLiveRazorpay();
