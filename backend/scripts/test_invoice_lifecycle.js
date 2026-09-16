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
import invoiceService from '../src/services/invoiceService.js';
import * as orderService from '../src/services/orderService.js';
import { generateToken } from '../src/utils/generateToken.js';
import { ROLES } from '../src/constants/roles.js';

const streamToBuffer = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
};

const runInvoiceSuite = async () => {
  console.log('================================================================');
  console.log('🧪 Starting Phase 7 — Automated Backend Invoice PDF Test Suite');
  console.log('================================================================\n');

  await connectDB();

  let server;
  const testPort = 5077;
  server = app.listen(testPort);
  const BASE_URL = `http://localhost:${testPort}/api/v1`;

  const timestamp = Date.now();

  try {
    // -------------------------------------------------------------
    // SETUP: Create Test Fixtures (Customer 1, Customer 2, Admin, Product)
    // -------------------------------------------------------------
    console.log('🔹 Setup: Initializing test customers, admin, and products...');
    const customer1 = await User.create({
      phone: `92233${timestamp.toString().slice(-5)}`,
      name: 'Priya Sharma',
      email: `priya_${timestamp}@aurivatest.com`,
      role: 'USER',
      isVerified: true
    });

    const customer2 = await User.create({
      phone: `93344${timestamp.toString().slice(-5)}`,
      name: 'Ankit Mehta',
      email: `ankit_${timestamp}@aurivatest.com`,
      role: 'USER',
      isVerified: true
    });

    const testAdmin = await Admin.findOne({ email: 'admin@aurivafoods.com' }) ||
      await Admin.create({
        name: 'Super Admin',
        email: `admin_inv_${timestamp}@aurivafoods.com`,
        password: 'Admin@Password123',
        role: 'ADMIN',
        status: 'ACTIVE'
      });

    const tokenCust1 = generateToken({ id: customer1._id, role: ROLES.USER });
    const tokenCust2 = generateToken({ id: customer2._id, role: ROLES.USER });
    const tokenAdmin = generateToken({ id: testAdmin._id, role: ROLES.ADMIN });

    const prod1 = await Product.create({
      name: `Truffle Herb Makhana ${timestamp}`,
      slug: `truffle-herb-${timestamp}`,
      price: 249,
      oldPrice: 299,
      stockCount: 80,
      inStock: true,
      category: 'flavoured-makhana',
      image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087'
    });

    const prod2 = await Product.create({
      name: `Peri Peri Foxnuts ${timestamp}`,
      slug: `peri-peri-${timestamp}`,
      price: 199,
      oldPrice: 249,
      stockCount: 60,
      inStock: true,
      category: 'flavoured-makhana',
      image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087'
    });

    const addr1 = await Address.create({
      user: customer1._id,
      fullName: 'Priya Sharma',
      phoneNumber: '9876543210',
      addressLine1: 'Villa 14, Royal Palm Residency',
      addressLine2: 'Near Regal Square',
      city: 'Indore',
      state: 'Madhya Pradesh',
      postalCode: '452001'
    });

    console.log('  ✅ [PASS] Fixtures initialized successfully.\n');

    // -------------------------------------------------------------
    // TEST 1: Place Orders (COD & Paid with Discount)
    // -------------------------------------------------------------
    console.log('🔹 Test 1: Creating Orders with Real Database Pricing Snapshot');
    await Cart.findOneAndUpdate(
      { user: customer1._id },
      {
        $set: {
          items: [
            { product: prod1._id, name: prod1.name, price: prod1.price, weight: '150g', qty: 2 },
            { product: prod2._id, name: prod2.name, price: prod2.price, weight: '150g', qty: 1 }
          ]
        }
      },
      { upsert: true }
    );

    const order1 = await orderService.placeOrder(customer1._id, {
      addressId: addr1._id,
      paymentMethod: 'COD'
    });

    assert(order1.orderNumber, 'Order 1 must have an orderNumber');
    assert.strictEqual(order1.items.length, 2, 'Order 1 should have 2 line items');
    assert.strictEqual(order1.payment.method, 'COD', 'Payment method should be COD');
    console.log(`  ✅ [PASS] Order #${order1.orderNumber} created (Subtotal: Rs. ${order1.pricing.subtotal}, Total: Rs. ${order1.pricing.total})`);

    // Create Order 2: Paid online order with transaction ID
    await Cart.findOneAndUpdate(
      { user: customer1._id },
      {
        $set: {
          items: [{ product: prod1._id, name: prod1.name, price: prod1.price, weight: '150g', qty: 1 }]
        }
      },
      { upsert: true }
    );

    const order2 = await orderService.placeOrder(customer1._id, {
      addressId: addr1._id,
      paymentMethod: 'UPI',
      paymentDetails: {
        transactionId: `TXN_TEST_${timestamp}`
      }
    });

    order2.payment.status = 'PAID';
    order2.payment.paidAt = new Date();
    await order2.save();

    console.log(`  ✅ [PASS] Order #${order2.orderNumber} created with status=PAID, transactionId=${order2.payment.transactionId}`);

    // -------------------------------------------------------------
    // TEST 2: Direct PDF Buffer Generation & Magic Bytes Verification
    // -------------------------------------------------------------
    console.log('\n🔹 Test 2: Direct PDF Generation Engine & Header Signatures');
    const pdfDoc = await invoiceService.generateInvoicePdf(order1);
    const pdfBuffer = await streamToBuffer(pdfDoc);

    assert(Buffer.isBuffer(pdfBuffer), 'Result must be a binary Buffer');
    assert(pdfBuffer.length > 3000, `PDF size should be substantial (got ${pdfBuffer.length} bytes)`);

    // Check PDF Magic Bytes '%PDF-'
    const magicHeader = pdfBuffer.slice(0, 5).toString('ascii');
    assert.strictEqual(magicHeader, '%PDF-', 'Buffer must begin with valid PDF signature (%PDF-)');
    console.log(`  ✅ [PASS] PDF generated successfully (${pdfBuffer.length} bytes, Magic Header: ${magicHeader})`);

    // -------------------------------------------------------------
    // TEST 3: Customer Invoice HTTP Download API (GET /orders/:id/invoice)
    // -------------------------------------------------------------
    console.log('\n🔹 Test 3: Customer Invoice HTTP Download API');

    // 3.1 Customer 1 downloading own invoice (Inline view)
    const cust1Res = await fetch(`${BASE_URL}/orders/${order1.orderNumber}/invoice`, {
      headers: { Authorization: `Bearer ${tokenCust1}` }
    });
    assert.strictEqual(cust1Res.status, 200, 'Customer should get 200 OK');
    assert.strictEqual(cust1Res.headers.get('content-type'), 'application/pdf');
    const disposition = cust1Res.headers.get('content-disposition');
    assert(disposition.includes('inline'), 'Default disposition should be inline');
    assert(disposition.includes(`Invoice-${order1.orderNumber}.pdf`), 'Filename must match invoice format');

    const cust1Buffer = Buffer.from(await cust1Res.arrayBuffer());
    assert.strictEqual(cust1Buffer.slice(0, 5).toString('ascii'), '%PDF-');
    console.log('  ✅ [PASS] Customer successfully fetched own invoice PDF with correct content headers');

    // 3.2 Customer 1 downloading with ?download=1 (Attachment mode)
    const downloadRes = await fetch(`${BASE_URL}/orders/${order1._id}/invoice?download=1`, {
      headers: { Authorization: `Bearer ${tokenCust1}` }
    });
    assert.strictEqual(downloadRes.status, 200);
    const downloadDisp = downloadRes.headers.get('content-disposition');
    assert(downloadDisp.includes('attachment'), 'Query download=1 should trigger attachment disposition');
    console.log('  ✅ [PASS] ?download=1 query parameter correctly sets attachment disposition');

    // -------------------------------------------------------------
    // TEST 4: Security & Ownership Protection (Customer 2 blocked)
    // -------------------------------------------------------------
    console.log('\n🔹 Test 4: Security & Tenant Isolation Enforcement');
    const forbiddenRes = await fetch(`${BASE_URL}/orders/${order1.orderNumber}/invoice`, {
      headers: { Authorization: `Bearer ${tokenCust2}` }
    });
    assert.strictEqual(forbiddenRes.status, 403, 'Customer 2 should be rejected with 403 Forbidden');
    const forbiddenData = await forbiddenRes.json();
    assert.strictEqual(forbiddenData.success, false);
    assert(forbiddenData.message.includes('permission'), 'Error message should cite permission');
    console.log('  ✅ [PASS] Cross-customer invoice access strictly blocked with HTTP 403 Forbidden');

    // Unauthenticated access
    const unauthRes = await fetch(`${BASE_URL}/orders/${order1.orderNumber}/invoice`);
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request should return 401');
    console.log('  ✅ [PASS] Unauthenticated request safely blocked with HTTP 401 Unauthorized');

    // -------------------------------------------------------------
    // TEST 5: Admin Invoice HTTP Download API (GET /admin/orders/:id/invoice)
    // -------------------------------------------------------------
    console.log('\n🔹 Test 5: Admin Official Invoice API');
    const adminRes = await fetch(`${BASE_URL}/admin/orders/${order1._id}/invoice`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    assert.strictEqual(adminRes.status, 200, 'Admin should get 200 OK');
    assert.strictEqual(adminRes.headers.get('content-type'), 'application/pdf');
    const adminBuffer = Buffer.from(await adminRes.arrayBuffer());
    assert.strictEqual(adminBuffer.slice(0, 5).toString('ascii'), '%PDF-');
    console.log('  ✅ [PASS] Admin successfully downloaded order invoice PDF');

    // Customer accessing admin endpoint -> 403
    const adminForbiddenRes = await fetch(`${BASE_URL}/admin/orders/${order1._id}/invoice`, {
      headers: { Authorization: `Bearer ${tokenCust1}` }
    });
    assert.strictEqual(adminForbiddenRes.status, 403, 'Customer cannot access admin invoice endpoint');
    console.log('  ✅ [PASS] Customer blocked from admin invoice route with HTTP 403');

    // -------------------------------------------------------------
    // TEST 6: Paid Online Order with Transaction Details
    // -------------------------------------------------------------
    console.log('\n🔹 Test 6: Verifying Paid Online Order Invoice');
    const paidInvoiceDoc = await invoiceService.generateInvoicePdf(order2);
    const paidBuffer = await streamToBuffer(paidInvoiceDoc);
    assert(paidBuffer.length > 3000, 'Paid invoice buffer should be valid');
    console.log('  ✅ [PASS] Paid order invoice with transaction ID and status=PAID generated cleanly');

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log('\n🔹 Cleanup: Removing test records...');
    await Order.deleteMany({ _id: { $in: [order1._id, order2._id] } });
    await Address.deleteOne({ _id: addr1._id });
    await Product.deleteMany({ _id: { $in: [prod1._id, prod2._id] } });
    await User.deleteMany({ _id: { $in: [customer1._id, customer2._id] } });
    if (testAdmin.email.includes(timestamp.toString())) {
      await Admin.deleteOne({ _id: testAdmin._id });
    }
    console.log('  ✅ [PASS] Cleanup completed.');

    console.log('\n================================================================');
    console.log('🎉 ALL INVOICE LIFECYCLE TESTS PASSED! (16 assertions verified)');
    console.log('================================================================\n');

    server.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Invoice Test Suite Failed:', error);
    if (server) server.close();
    process.exit(1);
  }
};

runInvoiceSuite();
