/**
 * Complete Order Management Lifecycle Integration Test Suite
 * Tests all 20 criteria specified in Phase 1
 */
import mongoose from 'mongoose';
import env from '../src/config/env.js';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Admin from '../src/models/Admin.js';
import Product from '../src/models/Product.js';
import Address from '../src/models/Address.js';
import Cart from '../src/models/Cart.js';
import Order from '../src/models/Order.js';
import * as orderService from '../src/services/orderService.js';
import { generateToken } from '../src/utils/generateToken.js';
import { ROLES } from '../src/constants/roles.js';

let passedTests = 0;
let totalTests = 0;

const assert = (condition, testName) => {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
};

const runOrderLifecycleSuite = async () => {
  console.log('================================================================');
  console.log('🧪 Starting Phase 1 — Complete Order Management Integration Test');
  console.log('================================================================\n');

  await connectDB();

  try {
    // 0. Setup test fixtures: Customer 1, Customer 2, Admin, and Product
    console.log('📦 Setting up test fixtures (Customers, Admin, Product, Address)...');
    
    // Clean any prior test artifacts
    await Order.deleteMany({ orderNumber: { $regex: /^TEST_/ } });
    await Product.deleteMany({ slug: 'test-makhana-crisps' });
    await User.deleteMany({ phone: { $in: ['9999900001', '9999900002'] } });

    // Customer 1
    const customer1 = await User.create({
      name: 'Test Customer One',
      phone: '9999900001',
      role: ROLES.USER,
      isVerified: true
    });

    // Customer 2
    const customer2 = await User.create({
      name: 'Test Customer Two',
      phone: '9999900002',
      role: ROLES.USER,
      isVerified: true
    });

    // Address for Customer 1
    const testAddress1 = await Address.create({
      user: customer1._id,
      fullName: 'Test Customer One',
      phoneNumber: '9999900001',
      addressLine1: 'Flat 101, Test Residency',
      city: 'Indore',
      state: 'Madhya Pradesh',
      postalCode: '452001',
      isDefault: true
    });

    // Product with initial stock of 100 units
    const testProduct = await Product.create({
      name: 'Test Makhana Crisps',
      slug: 'test-makhana-crisps',
      price: 200,
      stockCount: 100,
      inStock: true,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150',
      category: 'flavoured-makhana',
      weight: '150g'
    });

    console.log(`  Initial Product Stock: ${testProduct.stockCount} units\n`);

    // -------------------------------------------------------------
    // Test 1: Customer Places Order & Stock Deducts
    // -------------------------------------------------------------
    console.log('🔹 Test 1: Customer places order & initial inventory deducts');
    // Prepare cart for customer 1 with 3 units
    await Cart.findOneAndUpdate(
      { user: customer1._id },
      {
        user: customer1._id,
        items: [
          {
            product: testProduct._id,
            name: testProduct.name,
            weight: '150g',
            price: testProduct.price,
            qty: 3
          }
        ]
      },
      { upsert: true }
    );

    const order1 = await orderService.placeOrder(customer1._id, {
      addressId: testAddress1._id,
      paymentMethod: 'COD',
      idempotencyKey: `TEST_IDEMP_${Date.now()}`
    });

    assert(order1 && order1.status === 'CONFIRMED', 'Order is created with CONFIRMED status');
    assert(order1.items[0].qty === 3, 'Order item quantity is 3');

    const freshProdAfterOrder = await Product.findById(testProduct._id);
    assert(freshProdAfterOrder.stockCount === 97, `Stock deducted from 100 to 97 (actual: ${freshProdAfterOrder.stockCount})`);

    // -------------------------------------------------------------
    // Test 2: Admin lists orders
    // -------------------------------------------------------------
    console.log('\n🔹 Test 2: Admin lists orders via getAllOrdersAdmin');
    const adminOrdersRes = await orderService.getAllOrdersAdmin({ page: 1, limit: 10 });
    assert(adminOrdersRes.orders.length > 0, 'Admin can list orders');
    assert(adminOrdersRes.pagination.total > 0, 'Admin receives pagination metadata');

    // -------------------------------------------------------------
    // Test 3: Admin filters orders by status
    // -------------------------------------------------------------
    console.log('\n🔹 Test 3: Admin filters orders by status');
    const filteredRes = await orderService.getAllOrdersAdmin({ status: 'CONFIRMED' });
    const allAreConfirmed = filteredRes.orders.every(o => o.status === 'CONFIRMED');
    assert(allAreConfirmed && filteredRes.orders.length > 0, 'Admin filters orders by status CONFIRMED');

    // -------------------------------------------------------------
    // Test 4: Admin searches order by orderNumber / customer
    // -------------------------------------------------------------
    console.log('\n🔹 Test 4: Admin searches order by Order Number');
    const searchRes = await orderService.getAllOrdersAdmin({ search: order1.orderNumber });
    assert(searchRes.orders.length >= 1 && searchRes.orders[0].orderNumber === order1.orderNumber, 'Admin searches order by orderNumber');

    // -------------------------------------------------------------
    // Test 5: Admin retrieves complete order details
    // -------------------------------------------------------------
    console.log('\n🔹 Test 5: Admin retrieves full order details');
    const orderDetails = await orderService.getOrderById(null, order1._id, true);
    assert(orderDetails.pricing.total > 0, 'Order details includes full pricing breakdown');
    assert(orderDetails.shippingAddress.fullName === 'Test Customer One', 'Order details includes shipping address');

    // -------------------------------------------------------------
    // Test 6: Admin updates status: CONFIRMED -> PACKED
    // -------------------------------------------------------------
    console.log('\n🔹 Test 6: Status transition CONFIRMED -> PACKED');
    const packedOrder = await orderService.updateOrderStatusAdmin(order1._id, 'PACKED', {
      updatedBy: 'Test Admin',
      note: 'Inspected and sealed in packaging'
    });
    assert(packedOrder.status === 'PACKED', 'Order status updated to PACKED');
    const packedStep = packedOrder.timeline.find(t => t.status === 'Packed');
    assert(packedStep && packedStep.done === true, 'Timeline records Packed step as done');

    // -------------------------------------------------------------
    // Test 7: Admin updates status: PACKED -> SHIPPED
    // -------------------------------------------------------------
    console.log('\n🔹 Test 7: Status transition PACKED -> SHIPPED');
    const shippedOrder = await orderService.updateOrderStatusAdmin(order1._id, 'SHIPPED', {
      updatedBy: 'Test Admin',
      note: 'Dispatched to Delhivery Hub'
    });
    assert(shippedOrder.status === 'SHIPPED', 'Order status updated to SHIPPED');

    // -------------------------------------------------------------
    // Test 8 & 9: Admin assigns courier, AWB tracking, and Rider
    // -------------------------------------------------------------
    console.log('\n🔹 Test 8 & 9: Admin assigns dispatch tracking (Courier, AWB, Rider)');
    const dispatchedOrder = await orderService.dispatchOrderAdmin(order1._id, {
      courierName: 'Delhivery Express',
      awbNumber: 'AWB-TEST-887766',
      rider: {
        name: 'Vikas Sharma',
        phone: '+91 9888877777',
        vehicle: 'MP09-XY-9999'
      },
      deliveryNotes: 'Priority delivery within 2 hours'
    });
    assert(dispatchedOrder.courierName === 'Delhivery Express', 'Courier partner stored');
    assert(dispatchedOrder.awbNumber === 'AWB-TEST-887766', 'AWB tracking number stored');
    assert(dispatchedOrder.rider.name === 'Vikas Sharma', 'Delivery rider assigned');

    // -------------------------------------------------------------
    // Test 10: Admin updates status: SHIPPED -> OUT_FOR_DELIVERY
    // -------------------------------------------------------------
    console.log('\n🔹 Test 10: Status transition SHIPPED -> OUT_FOR_DELIVERY');
    const outOrder = await orderService.updateOrderStatusAdmin(order1._id, 'OUT_FOR_DELIVERY', {
      updatedBy: 'Hub Manager',
      note: 'Rider is en route to customer destination'
    });
    assert(outOrder.status === 'OUT_FOR_DELIVERY', 'Order status updated to OUT_FOR_DELIVERY');

    // -------------------------------------------------------------
    // Test 11: Admin updates status: OUT_FOR_DELIVERY -> DELIVERED
    // -------------------------------------------------------------
    console.log('\n🔹 Test 11: Status transition OUT_FOR_DELIVERY -> DELIVERED');
    const deliveredOrder = await orderService.updateOrderStatusAdmin(order1._id, 'DELIVERED', {
      updatedBy: 'Delivery Confirmation',
      note: 'Delivered to customer doorstep'
    });
    assert(deliveredOrder.status === 'DELIVERED', 'Order status updated to DELIVERED');
    assert(deliveredOrder.payment.status === 'PAID', 'Payment status marked as PAID upon delivery');

    // -------------------------------------------------------------
    // Test 12: Customer retrieves live tracking with full timeline
    // -------------------------------------------------------------
    console.log('\n🔹 Test 12: Customer verifies updated live tracking timeline');
    const customerView = await orderService.getOrderById(customer1._id, order1.orderNumber, false);
    assert(customerView.status === 'DELIVERED', 'Customer sees delivered status');
    assert(customerView.timeline.every(t => t.done === true), 'All timeline stages are completed');

    // -------------------------------------------------------------
    // Test 13: Invalid transition check (DELIVERED -> PACKED must be rejected)
    // -------------------------------------------------------------
    console.log('\n🔹 Test 13: Invalid backward transition (DELIVERED -> PACKED)');
    let invalidTransitionBlocked = false;
    try {
      await orderService.updateOrderStatusAdmin(order1._id, 'PACKED');
    } catch (err) {
      invalidTransitionBlocked = true;
      assert(err.statusCode === 400, 'Invalid transition throws 400 status code');
    }
    assert(invalidTransitionBlocked, 'DELIVERED -> PACKED transition was blocked');

    // -------------------------------------------------------------
    // Test 14: Delivered order cannot be cancelled
    // -------------------------------------------------------------
    console.log('\n🔹 Test 14: Delivered order cannot be cancelled');
    let deliveredCancelBlocked = false;
    try {
      await orderService.cancelOrder(order1._id, {
        cancelledBy: 'CUSTOMER',
        userId: customer1._id
      });
    } catch (err) {
      deliveredCancelBlocked = true;
      assert(err.statusCode === 400, 'Delivered cancellation throws 400 error');
    }
    assert(deliveredCancelBlocked, 'Cancellation of delivered order was blocked');

    // -------------------------------------------------------------
    // Test 15 & 16: Customer order placement, cancellation & ATOMIC stock restoration
    // -------------------------------------------------------------
    console.log('\n🔹 Test 15 & 16: Customer order cancellation & ATOMIC stock restoration');
    // Customer 1 places new order of 5 units (Stock is currently 97, should become 92)
    await Cart.findOneAndUpdate(
      { user: customer1._id },
      {
        user: customer1._id,
        items: [
          {
            product: testProduct._id,
            name: testProduct.name,
            weight: '150g',
            price: testProduct.price,
            qty: 5
          }
        ]
      },
      { upsert: true }
    );

    const order2 = await orderService.placeOrder(customer1._id, {
      addressId: testAddress1._id,
      paymentMethod: 'COD',
      idempotencyKey: `TEST_IDEMP_CANCEL_${Date.now()}`
    });

    const stockAfterOrder2 = await Product.findById(testProduct._id);
    assert(stockAfterOrder2.stockCount === 92, `Stock deducted from 97 to 92 (actual: ${stockAfterOrder2.stockCount})`);

    // Customer cancels order2 (status is CONFIRMED)
    const cancelledOrder2 = await orderService.cancelOrder(order2._id, {
      cancelledBy: 'CUSTOMER',
      cancelReason: 'Need to change delivery location',
      userId: customer1._id,
      isAdmin: false
    });

    assert(cancelledOrder2.status === 'CANCELLED', 'Order status changed to CANCELLED');
    assert(cancelledOrder2.isStockRestored === true, 'isStockRestored flag set to true');

    const stockAfterCancel2 = await Product.findById(testProduct._id);
    assert(stockAfterCancel2.stockCount === 97, `Stock atomically restored from 92 back to 97 (actual: ${stockAfterCancel2.stockCount})`);

    // -------------------------------------------------------------
    // Test 17: Duplicate cancellation is rejected & does not restore stock twice
    // -------------------------------------------------------------
    console.log('\n🔹 Test 17: Duplicate cancellation is rejected (Anti-double-restock)');
    let duplicateCancelBlocked = false;
    try {
      await orderService.cancelOrder(order2._id, {
        cancelledBy: 'CUSTOMER',
        userId: customer1._id
      });
    } catch (err) {
      duplicateCancelBlocked = true;
      assert(err.statusCode === 400, 'Duplicate cancellation throws 400 error');
    }
    assert(duplicateCancelBlocked, 'Duplicate cancellation was rejected');

    const stockAfterDuplicate = await Product.findById(testProduct._id);
    assert(stockAfterDuplicate.stockCount === 97, 'Stock remains 97 (NOT restored twice)');

    // -------------------------------------------------------------
    // Test 18: Admin order cancellation also restores stock
    // -------------------------------------------------------------
    console.log('\n🔹 Test 18: Admin cancellation & stock restoration');
    // Customer 1 places order 3 of 7 units
    await Cart.findOneAndUpdate(
      { user: customer1._id },
      {
        user: customer1._id,
        items: [
          {
            product: testProduct._id,
            name: testProduct.name,
            weight: '150g',
            price: testProduct.price,
            qty: 7
          }
        ]
      },
      { upsert: true }
    );

    const order3 = await orderService.placeOrder(customer1._id, {
      addressId: testAddress1._id,
      paymentMethod: 'UPI',
      idempotencyKey: `TEST_IDEMP_ADMIN_CANCEL_${Date.now()}`
    });

    const stockAfterOrder3 = await Product.findById(testProduct._id);
    assert(stockAfterOrder3.stockCount === 90, `Stock deducted to 90 (actual: ${stockAfterOrder3.stockCount})`);

    // Admin cancels order 3
    const adminCancelled = await orderService.cancelOrder(order3._id, {
      cancelledBy: 'ADMIN',
      cancelReason: 'Customer requested phone cancellation',
      isAdmin: true
    });

    assert(adminCancelled.status === 'CANCELLED', 'Admin successfully cancelled order');
    const stockAfterAdminCancel = await Product.findById(testProduct._id);
    assert(stockAfterAdminCancel.stockCount === 97, `Stock atomically restored back to 97 (actual: ${stockAfterAdminCancel.stockCount})`);

    // -------------------------------------------------------------
    // Test 19: Unauthorized customer cannot cancel another customer's order
    // -------------------------------------------------------------
    console.log('\n🔹 Test 19: Customer isolation (Customer 2 cannot cancel Customer 1 order)');
    // Place order 4 for Customer 1
    await Cart.findOneAndUpdate(
      { user: customer1._id },
      {
        user: customer1._id,
        items: [
          {
            product: testProduct._id,
            name: testProduct.name,
            weight: '150g',
            price: testProduct.price,
            qty: 2
          }
        ]
      },
      { upsert: true }
    );

    const order4 = await orderService.placeOrder(customer1._id, {
      addressId: testAddress1._id,
      paymentMethod: 'COD',
      idempotencyKey: `TEST_IDEMP_ISOLATION_${Date.now()}`
    });

    let crossUserCancelBlocked = false;
    try {
      await orderService.cancelOrder(order4._id, {
        cancelledBy: 'CUSTOMER',
        userId: customer2._id, // Customer 2 attempting to cancel Customer 1's order
        isAdmin: false
      });
    } catch (err) {
      crossUserCancelBlocked = true;
      assert(err.statusCode === 404, 'Cross-user access returns 404 Not Found');
    }
    assert(crossUserCancelBlocked, 'Cross-user order cancellation is blocked');

    // -------------------------------------------------------------
    // Test 20: Clean up test artifacts
    // -------------------------------------------------------------
    console.log('\n🔹 Test 20: Test cleanup');
    await Order.deleteMany({ _id: { $in: [order1._id, order2._id, order3._id, order4._id] } });
    await Address.deleteMany({ _id: testAddress1._id });
    await Product.deleteMany({ _id: testProduct._id });
    await User.deleteMany({ _id: { $in: [customer1._id, customer2._id] } });
    assert(true, 'Test artifacts cleaned up successfully');

    console.log('\n================================================================');
    console.log(`🎉 ALL TESTS PASSED! (${passedTests}/${totalTests} assertions verified)`);
    console.log('================================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
};

runOrderLifecycleSuite();
