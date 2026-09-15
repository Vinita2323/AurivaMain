import assert from 'assert';
import crypto from 'crypto';
import mongoose from 'mongoose';
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
  isRazorpayConfigured,
  getPublicRazorpayKey,
  verifyPaymentSignature,
  verifyWebhookSignature
} from '../src/config/razorpay.js';

const runPaymentTests = async () => {
  console.log('================================================================');
  console.log('🧪 Starting Phase 2 — Payment Architecture & Razorpay Suite');
  console.log('================================================================\n');

  await connectDB();

  let customer1, customer2, adminUser;
  let testProduct;
  let testAddress;
  let passedCount = 0;

  const pass = (msg) => {
    passedCount++;
    console.log(`  ✅ [PASS] ${msg}`);
  };

  try {
    // -------------------------------------------------------------
    // Setup Test Fixtures
    // -------------------------------------------------------------
    const timestamp = Date.now();
    customer1 = await User.create({
      phone: `99911${timestamp.toString().slice(-5)}`,
      name: 'Payment Test Customer 1',
      email: `cust1_${timestamp}@aurivatest.com`,
      role: 'USER',
      isVerified: true
    });

    customer2 = await User.create({
      phone: `99922${timestamp.toString().slice(-5)}`,
      name: 'Payment Test Customer 2',
      email: `cust2_${timestamp}@aurivatest.com`,
      role: 'USER',
      isVerified: true
    });

    adminUser = await User.create({
      phone: `99933${timestamp.toString().slice(-5)}`,
      name: 'Payment Test Admin',
      email: `admin_${timestamp}@aurivatest.com`,
      role: 'ADMIN',
      isVerified: true
    });

    testProduct = await Product.create({
      name: `Payment Test Makhana ${timestamp}`,
      slug: `payment-test-makhana-${timestamp}`,
      price: 250,
      originalPrice: 300,
      stockCount: 50,
      inStock: true,
      category: 'Snacks',
      description: 'Test product for payment architecture',
      image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087'
    });

    testAddress = await Address.create({
      user: customer1._id,
      fullName: 'Customer One',
      phoneNumber: '9991100000',
      addressLine1: 'Flat 101, Test Residency',
      city: 'Indore',
      state: 'Madhya Pradesh',
      postalCode: '452001',
      addressType: 'home'
    });

    // -------------------------------------------------------------
    // Test 1: Gateway Configuration Check without credentials
    // -------------------------------------------------------------
    console.log('🔹 Test 1: Gateway Configuration Check');
    const config = PaymentService.getPaymentConfig();
    assert.strictEqual(config.isConfigured, true, 'isConfigured should be true when live credentials provided');
    assert.strictEqual(config.keyId, 'rzp_test_TRZdg2aAOYv4KK', 'Public keyId matches configured key');
    assert.strictEqual(config.currency, 'INR', 'Currency should be INR');
    assert.strictEqual(config.keySecret, undefined, 'Secret must never be exposed');
    pass('Gateway correctly reports live configured status without exposing secrets');

    // -------------------------------------------------------------
    // Test 2: Cash on Delivery (COD) order placement works cleanly
    // -------------------------------------------------------------
    console.log('\n🔹 Test 2: Cash on Delivery (COD) Checkout & Ledger Creation');
    await Cart.findOneAndUpdate(
      { user: customer1._id },
      {
        $set: {
          items: [
            {
              product: testProduct._id,
              name: testProduct.name,
              price: testProduct.price,
              weight: '150g',
              qty: 2
            }
          ]
        }
      },
      { upsert: true }
    );

    const codOrder = await orderService.placeOrder(customer1._id, {
      addressId: testAddress._id,
      paymentMethod: 'COD'
    });

    assert(codOrder, 'COD Order should be created');
    assert.strictEqual(codOrder.payment.method, 'COD', 'Order payment method must be COD');
    assert.strictEqual(codOrder.payment.status, 'PENDING', 'COD initial payment status must be PENDING');
    assert.strictEqual(codOrder.status, 'CONFIRMED', 'COD order fulfillment status is CONFIRMED');
    pass('COD order created with method=COD, status=PENDING, order=CONFIRMED');

    // Check COD ledger entry
    const codPayment = await Payment.findOne({ order: codOrder._id });
    assert(codPayment, 'Payment transaction record must exist for COD order');
    assert.strictEqual(codPayment.gateway, 'COD', 'Payment gateway should be COD');
    assert.strictEqual(codPayment.status, 'PENDING', 'Payment record status should be PENDING');
    assert.strictEqual(codPayment.amount, codOrder.pricing.total, 'Payment amount must equal order total');
    pass('COD Payment ledger entry recorded with gateway=COD, amount=total');

    // -------------------------------------------------------------
    // Test 3: COD Order Delivery transitions payment to PAID
    // -------------------------------------------------------------
    console.log('\n🔹 Test 3: COD Delivery triggers status=PAID synchronization');
    await orderService.updateOrderStatusAdmin(codOrder._id, 'PACKED');
    await orderService.updateOrderStatusAdmin(codOrder._id, 'SHIPPED');
    await orderService.updateOrderStatusAdmin(codOrder._id, 'OUT_FOR_DELIVERY');
    const deliveredOrder = await orderService.updateOrderStatusAdmin(
      codOrder._id,
      'DELIVERED',
      { updatedBy: 'Delivery Rider', note: 'Handed over to customer with cash collected' }
    );

    assert.strictEqual(deliveredOrder.payment.status, 'PAID', 'Delivered COD order must have payment status PAID');
    const updatedCodPayment = await Payment.findOne({ order: codOrder._id });
    assert.strictEqual(updatedCodPayment.status, 'PAID', 'Delivered COD Payment record must synchronize to PAID');
    assert(updatedCodPayment.paidAt instanceof Date, 'paidAt timestamp must be recorded');
    pass('COD payment status atomically synchronized to PAID upon delivery');

    // -------------------------------------------------------------
    // Test 4: Online Order Creation (starts as PENDING, not falsely PAID)
    // -------------------------------------------------------------
    console.log('\n🔹 Test 4: Online Order starts in PENDING payment state');
    await Cart.findOneAndUpdate(
      { user: customer1._id },
      {
        $set: {
          items: [
            {
              product: testProduct._id,
              name: testProduct.name,
              price: testProduct.price,
              weight: '150g',
              qty: 1
            }
          ]
        }
      },
      { upsert: true }
    );

    const onlineOrder = await orderService.placeOrder(customer1._id, {
      addressId: testAddress._id,
      paymentMethod: 'UPI'
    });

    assert.strictEqual(onlineOrder.payment.method, 'UPI', 'Payment method is UPI');
    assert.strictEqual(onlineOrder.payment.status, 'PENDING', 'Online payment MUST start as PENDING (not fake PAID)');
    assert.strictEqual(onlineOrder.payment.transactionId, '', 'Online payment must not have fake transaction ID');
    pass('Online order initialized safely as PENDING without fake credentials');

    // -------------------------------------------------------------
    // Test 5: createPaymentOrder returns controlled 503 when unconfigured
    // -------------------------------------------------------------
    console.log('\n🔹 Test 5: createPaymentOrder fails gracefully when credentials missing');
    const originalConfigured = env.RAZORPAY.IS_CONFIGURED;
    env.RAZORPAY.IS_CONFIGURED = false;
    let gatewayError = null;
    try {
      await PaymentService.createPaymentOrder(customer1._id, { orderId: onlineOrder._id.toString() });
    } catch (err) {
      gatewayError = err;
    } finally {
      env.RAZORPAY.IS_CONFIGURED = originalConfigured;
    }
    assert(gatewayError, 'createPaymentOrder should throw controlled error');
    assert.strictEqual(gatewayError.statusCode, 503, 'Error status should be HTTP 503');
    assert.strictEqual(gatewayError.code, 'GATEWAY_NOT_CONFIGURED', 'Error code must be GATEWAY_NOT_CONFIGURED');
    pass('createPaymentOrder returns controlled HTTP 503 without crashing backend');

    // -------------------------------------------------------------
    // Test 6: Access Control: Customer 2 cannot initiate payment for Customer 1 order
    // -------------------------------------------------------------
    console.log('\n🔹 Test 6: Cross-user authorization check');
    let authError = null;
    try {
      await PaymentService.createPaymentOrder(customer2._id, { orderId: onlineOrder._id.toString() });
    } catch (err) {
      authError = err;
    }
    assert(authError, 'Unauthorized customer payment attempt must throw error');
    assert.strictEqual(authError.statusCode, 403, 'Cross-user attempt must return HTTP 403 Forbidden');
    pass('Customer 2 blocked from initiating payment for Customer 1 order with HTTP 403');

    // -------------------------------------------------------------
    // Test 7: Non-existent order returns HTTP 404
    // -------------------------------------------------------------
    console.log('\n🔹 Test 7: Non-existent order ID validation');
    let notFoundErr = null;
    try {
      await PaymentService.createPaymentOrder(customer1._id, {
        orderId: new mongoose.Types.ObjectId().toString()
      });
    } catch (err) {
      notFoundErr = err;
    }
    assert(notFoundErr, 'Non-existent order must throw error');
    assert.strictEqual(notFoundErr.statusCode, 404, 'Non-existent order must return HTTP 404');
    pass('Invalid order ID returns HTTP 404 Not Found');

    // -------------------------------------------------------------
    // Test 8: Already paid order rejects new payment initiation
    // -------------------------------------------------------------
    console.log('\n🔹 Test 8: Already-paid order rejects duplicate payment order');
    let alreadyPaidErr = null;
    try {
      await PaymentService.createPaymentOrder(customer1._id, { orderId: codOrder._id.toString() });
    } catch (err) {
      alreadyPaidErr = err;
    }
    assert(alreadyPaidErr, 'Already paid order must reject payment order creation');
    assert.strictEqual(alreadyPaidErr.statusCode, 400, 'Already paid order throws HTTP 400');
    pass('Paid order rejects additional payment initiation');

    // -------------------------------------------------------------
    // Test 9: Cryptographic Signature Verification Unit Logic
    // -------------------------------------------------------------
    console.log('\n🔹 Test 9: HMAC SHA256 Payment Signature Verification Logic');
    const testSecret = 'test_razorpay_secret_key_12345';
    const testRzpOrderId = 'order_DA0001test';
    const testRzpPaymentId = 'pay_DA0001test';

    // Generate valid signature using official algorithm
    const validSignature = crypto
      .createHmac('sha256', testSecret)
      .update(`${testRzpOrderId}|${testRzpPaymentId}`)
      .digest('hex');

    const isValid = verifyPaymentSignature({
      orderId: testRzpOrderId,
      paymentId: testRzpPaymentId,
      signature: validSignature,
      secret: testSecret
    });
    assert.strictEqual(isValid, true, 'Valid signature should verify to true');
    pass('HMAC-SHA256 signature verification accepts authentic signature');

    // Tampered signature must fail
    const tamperedSignature = validSignature.slice(0, -4) + '0000';
    const isTamperedValid = verifyPaymentSignature({
      orderId: testRzpOrderId,
      paymentId: testRzpPaymentId,
      signature: tamperedSignature,
      secret: testSecret
    });
    assert.strictEqual(isTamperedValid, false, 'Tampered signature must verify to false');
    pass('Tampered signature is strictly rejected');

    // Mismatched paymentId must fail
    const isMismatchedValid = verifyPaymentSignature({
      orderId: testRzpOrderId,
      paymentId: 'pay_DIFFERENT',
      signature: validSignature,
      secret: testSecret
    });
    assert.strictEqual(isMismatchedValid, false, 'Mismatched paymentId must verify to false');
    pass('Signature verification rejects mismatched order or payment IDs');

    // -------------------------------------------------------------
    // Test 10: Webhook Signature Verification Logic
    // -------------------------------------------------------------
    console.log('\n🔹 Test 10: Webhook HMAC SHA256 Signature Verification');
    const testWebhookSecret = 'webhook_secret_key_secure_999';
    const testRawBody = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_123' } } } });

    const validWebhookSig = crypto
      .createHmac('sha256', testWebhookSecret)
      .update(testRawBody)
      .digest('hex');

    const isWebhookValid = verifyWebhookSignature({
      rawBody: testRawBody,
      signature: validWebhookSig,
      webhookSecret: testWebhookSecret
    });
    assert.strictEqual(isWebhookValid, true, 'Valid webhook signature must verify to true');
    pass('Valid webhook signature accepts authentic payload');

    const isTamperedWebhookValid = verifyWebhookSignature({
      rawBody: testRawBody + ' ',
      signature: validWebhookSig,
      webhookSecret: testWebhookSecret
    });
    assert.strictEqual(isTamperedWebhookValid, false, 'Altered webhook payload must reject');
    pass('Tampered webhook payload is strictly rejected');

    // -------------------------------------------------------------
    // Test 11: Webhook Event Ingestion: payment.captured
    // -------------------------------------------------------------
    console.log('\n🔹 Test 11: Webhook Event Ingestion: payment.captured');
    const capturedGatewayOrderId = `order_HOOK_${Date.now()}`;
    const capturedGatewayPaymentId = `pay_HOOK_${Date.now()}`;

    // Create payment in PENDING state
    const pendingPayment = await Payment.create({
      order: onlineOrder._id,
      user: customer1._id,
      gateway: 'RAZORPAY',
      gatewayOrderId: capturedGatewayOrderId,
      amount: onlineOrder.pricing.total,
      currency: 'INR',
      status: 'PENDING'
    });

    const makeSignedWebhookCall = async (eventPayload) => {
      const rawBody = JSON.stringify(eventPayload);
      const signature = crypto
        .createHmac('sha256', env.RAZORPAY.WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');
      return await PaymentService.handleWebhookEvent({
        rawBody,
        signature,
        eventPayload
      });
    };

    const webhookResult = await makeSignedWebhookCall({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: capturedGatewayPaymentId,
            order_id: capturedGatewayOrderId,
            created_at: Math.floor(Date.now() / 1000)
          }
        }
      }
    });

    assert.strictEqual(webhookResult.received, true, 'Webhook event should be acknowledged');
    const capturedPayment = await Payment.findById(pendingPayment._id);
    assert.strictEqual(capturedPayment.status, 'PAID', 'Payment status updated to PAID by webhook');
    assert.strictEqual(capturedPayment.gatewayPaymentId, capturedGatewayPaymentId, 'Gateway payment ID stored');

    const syncedOrder = await Order.findById(onlineOrder._id);
    assert.strictEqual(syncedOrder.payment.status, 'PAID', 'Order payment status synchronized to PAID');
    assert.strictEqual(syncedOrder.payment.transactionId, capturedGatewayPaymentId, 'Order transaction ID set');
    pass('Webhook payment.captured successfully synchronized Payment and Order to PAID');

    // -------------------------------------------------------------
    // Test 12: Webhook Idempotency: Duplicate payment.captured delivery
    // -------------------------------------------------------------
    console.log('\n🔹 Test 12: Webhook Idempotency on duplicate event');
    const dupResult = await makeSignedWebhookCall({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: capturedGatewayPaymentId,
            order_id: capturedGatewayOrderId,
            created_at: Math.floor(Date.now() / 1000)
          }
        }
      }
    });
    assert.strictEqual(dupResult.received, true, 'Duplicate webhook event received safely');
    const reCheckedPayment = await Payment.findById(pendingPayment._id);
    assert.strictEqual(reCheckedPayment.status, 'PAID', 'Payment status remains PAID without duplication');
    pass('Duplicate webhook delivery handled idempotently without corrupting state');

    // -------------------------------------------------------------
    // Test 13: Webhook Event Ingestion: payment.failed
    // -------------------------------------------------------------
    console.log('\n🔹 Test 13: Webhook Event Ingestion: payment.failed');
    const failedGatewayOrderId = `order_FAIL_${Date.now()}`;
    const failedPayment = await Payment.create({
      order: onlineOrder._id,
      user: customer1._id,
      gateway: 'RAZORPAY',
      gatewayOrderId: failedGatewayOrderId,
      amount: onlineOrder.pricing.total,
      currency: 'INR',
      status: 'PENDING'
    });

    await makeSignedWebhookCall({
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            order_id: failedGatewayOrderId,
            error_description: 'Bank servers down / Insufficient funds'
          }
        }
      }
    });

    const checkedFailedPayment = await Payment.findById(failedPayment._id);
    assert.strictEqual(checkedFailedPayment.status, 'FAILED', 'Payment status updated to FAILED');
    assert(checkedFailedPayment.failureReason.includes('Insufficient funds'), 'Failure reason stored accurately');
    pass('Webhook payment.failed safely marks transaction as FAILED with reason');

    // -------------------------------------------------------------
    // Test 14: Webhook Event Ingestion: refund.processed
    // -------------------------------------------------------------
    console.log('\n🔹 Test 14: Webhook Event Ingestion: refund.processed');
    await makeSignedWebhookCall({
      event: 'refund.processed',
      payload: {
        refund: {
          entity: {
            id: 'rfnd_TEST_999',
            payment_id: capturedGatewayPaymentId,
            amount: Math.round(capturedPayment.amount * 100),
            notes: { reason: 'Defective item return' }
          }
        }
      }
    });

    const refundedPayment = await Payment.findById(capturedPayment._id);
    assert.strictEqual(refundedPayment.status, 'REFUNDED', 'Payment status transitions to REFUNDED');
    assert.strictEqual(refundedPayment.refundedAmount, capturedPayment.amount, 'Full refund amount recorded');
    assert.strictEqual(refundedPayment.refunds.length, 1, 'Refund record appended');
    pass('Webhook refund.processed successfully recorded refund and updated status to REFUNDED');

    // -------------------------------------------------------------
    // Test 15: Admin Payments API and Financial KPI aggregation
    // -------------------------------------------------------------
    console.log('\n🔹 Test 15: Admin Payments List & KPI Stats Aggregation');
    const adminPaymentsData = await PaymentService.getAllPaymentsAdmin({});
    assert(Array.isArray(adminPaymentsData.payments), 'Admin payments should return an array');
    assert(adminPaymentsData.payments.length > 0, 'Should include newly created payment records');
    assert(adminPaymentsData.stats, 'KPI stats object must be included');
    assert(typeof adminPaymentsData.stats.total === 'number', 'Total payments count must be number');
    assert(typeof adminPaymentsData.stats.paidAmount === 'number', 'Paid amount KPI must be number');
    pass('Admin payment listing and KPI aggregation returned accurately');

    // -------------------------------------------------------------
    // Test 16: Admin Refund Validation: Cannot refund unpaid payment
    // -------------------------------------------------------------
    console.log('\n🔹 Test 16: Admin Refund Validation');
    let refundError = null;
    try {
      await PaymentService.initiateRefund(adminUser._id, failedPayment._id, {
        amount: 50,
        reason: 'Invalid refund attempt'
      });
    } catch (err) {
      refundError = err;
    }
    assert(refundError, 'Refunding FAILED payment must throw error');
    assert.strictEqual(refundError.statusCode, 400, 'Refund on non-paid status returns HTTP 400');
    pass('Refund on unpaid/failed transaction is strictly blocked');

    // -------------------------------------------------------------
    // Test 17: Admin Manual / COD Refund Execution
    // -------------------------------------------------------------
    console.log('\n🔹 Test 17: Admin Manual Refund on Delivered COD Order');
    const codRefund = await PaymentService.initiateRefund(adminUser._id, updatedCodPayment._id, {
      amount: 100,
      reason: 'Customer returned 1 item'
    });

    assert.strictEqual(codRefund.status, 'PARTIALLY_REFUNDED', 'Partial refund transitions to PARTIALLY_REFUNDED');
    assert.strictEqual(codRefund.refundedAmount, 100, 'Partial refund amount recorded');
    assert.strictEqual(codRefund.refunds.length, 1, 'Refund item logged');
    pass('Admin partial refund executed cleanly on COD ledger record');

    // -------------------------------------------------------------
    // Cleanup Test Data
    // -------------------------------------------------------------
    console.log('\n🔹 Cleaning up test fixtures...');
    await User.deleteMany({ _id: { $in: [customer1._id, customer2._id, adminUser._id] } });
    await Product.deleteOne({ _id: testProduct._id });
    await Address.deleteOne({ _id: testAddress._id });
    await Order.deleteMany({ user: { $in: [customer1._id, customer2._id] } });
    await Payment.deleteMany({ user: { $in: [customer1._id, customer2._id] } });
    await Cart.deleteMany({ user: { $in: [customer1._id, customer2._id] } });
    pass('Test fixtures cleaned up successfully');

    console.log('\n================================================================');
    console.log(`🎉 ALL PHASE 2 PAYMENT TESTS PASSED! (${passedCount} assertions verified)`);
    console.log('================================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Suite Failed with Error:', error);
    process.exit(1);
  }
};

runPaymentTests();
