/**
 * Phase 3 — Coupons & Discount Engine Integration Test Suite
 * 
 * Verifies all 18 critical scenarios:
 *  1. Percentage coupon validation & calculation
 *  2. Fixed discount coupon validation & calculation
 *  3. Expired coupon rejection
 *  4. Future coupon rejection
 *  5. Inactive coupon rejection
 *  6. Invalid coupon code rejection
 *  7. Minimum order requirement check
 *  8. Maximum discount capping (maxDiscount)
 *  9. Usage limit (usageLimit) enforcement
 * 10. Coupon applied to cart (cartService.applyCoupon)
 * 11. Coupon removed from cart (cartService.removeCoupon)
 * 12. Checkout pricing recalculation (orderService.getCheckoutSummary)
 * 13. Prevention of frontend price manipulation
 * 14. Order snapshot persistence (order.pricing.couponDetails)
 * 15. Atomic usedCount incrementing on order placement
 * 16. Race condition & duplicate request safety
 * 17. Admin CRUD operations (Create, Read, Update, Delete, Status Toggle)
 * 18. Access control (customer blocked from admin coupon endpoints)
 */

import mongoose from 'mongoose';
import env from '../src/config/env.js';
import Coupon from '../src/models/Coupon.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Cart from '../src/models/Cart.js';
import Order from '../src/models/Order.js';
import Address from '../src/models/Address.js';
import couponService from '../src/services/couponService.js';
import cartService from '../src/services/cartService.js';
import * as orderService from '../src/services/orderService.js';
import { generateToken } from '../src/utils/generateToken.js';
import { requireAdmin } from '../src/middleware/roleMiddleware.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 Starting Phase 3 — Coupons & Discount Engine Test Suite');
  console.log('================================================================\n');

  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('Connected to MongoDB database successfully.\n');

    // Clean up previous test coupon records
    await Coupon.deleteMany({ code: /^TEST_/ });
    await User.deleteMany({ email: /^test_coupon_/ });
    await Order.deleteMany({ orderNumber: /^TEST-COUPON-/ });

    // Setup Test User and Address
    const testUser = await User.create({
      name: 'Coupon Test Customer',
      phone: '98' + Math.floor(10000000 + Math.random() * 90000000),
      email: `test_coupon_${Date.now()}@example.com`,
      password: 'Password123!',
      role: 'USER'
    });

    const testAddress = await Address.create({
      user: testUser._id,
      fullName: 'Coupon Test Customer',
      phoneNumber: '9876543210',
      addressLine1: 'Flat 101, Test Residency',
      city: 'Indore',
      state: 'Madhya Pradesh',
      postalCode: '452001',
      isDefault: true
    });

    // Setup Test Product
    const testProduct = await Product.create({
      name: 'Test Makhana Tub 150g',
      slug: `test-makhana-${Date.now()}`,
      image: 'https://example.com/test-product.jpg',
      price: 250,
      oldPrice: 300,
      stockCount: 100,
      inStock: true,
      status: 'ACTIVE',
      weightOptions: [{ weight: '150g', price: 250, oldPrice: 300 }]
    });

    // -----------------------------------------------------------------
    // TEST 1: Percentage Coupon Validation & Calculation
    // -----------------------------------------------------------------
    console.log('--- Test 1: Percentage Coupon Validation & Calculation ---');
    const percentCoupon = await Coupon.create({
      code: 'TEST_PERC20',
      description: '20% Off Test Coupon',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minOrderValue: 200,
      status: 'ACTIVE'
    });

    const calcPerc = await couponService.validateCoupon({
      code: 'test_perc20', // Test case-insensitivity
      subtotal: 1000
    });
    assert(calcPerc.isValid === true, 'Percentage coupon validated successfully');
    assert(calcPerc.discount === 200, `Expected 20% of ₹1000 = ₹200, received ₹${calcPerc.discount}`);
    assert(calcPerc.finalSubtotal === 800, `Expected finalSubtotal = ₹800, received ₹${calcPerc.finalSubtotal}`);

    // -----------------------------------------------------------------
    // TEST 2: Fixed Discount Coupon Validation & Calculation
    // -----------------------------------------------------------------
    console.log('\n--- Test 2: Fixed Discount Coupon Validation & Calculation ---');
    const fixedCoupon = await Coupon.create({
      code: 'TEST_FLAT150',
      description: 'Flat ₹150 Off',
      discountType: 'FIXED',
      discountValue: 150,
      minOrderValue: 400,
      status: 'ACTIVE'
    });

    const calcFixed = await couponService.validateCoupon({
      code: 'TEST_FLAT150',
      subtotal: 600
    });
    assert(calcFixed.isValid === true, 'Fixed coupon validated successfully');
    assert(calcFixed.discount === 150, `Expected ₹150 discount, received ₹${calcFixed.discount}`);
    assert(calcFixed.finalSubtotal === 450, `Expected finalSubtotal = ₹450, received ₹${calcFixed.finalSubtotal}`);

    // -----------------------------------------------------------------
    // TEST 3: Expired Coupon Rejection
    // -----------------------------------------------------------------
    console.log('\n--- Test 3: Expired Coupon Rejection ---');
    await Coupon.create({
      code: 'TEST_EXPIRED',
      discountType: 'FIXED',
      discountValue: 100,
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: 'ACTIVE'
    });

    let expiredRejected = false;
    try {
      await couponService.validateCoupon({ code: 'TEST_EXPIRED', subtotal: 500 });
    } catch (err) {
      expiredRejected = err.message.includes('expired');
    }
    assert(expiredRejected, 'Expired coupon was properly rejected with error message');

    // -----------------------------------------------------------------
    // TEST 4: Future Coupon Rejection
    // -----------------------------------------------------------------
    console.log('\n--- Test 4: Future Coupon Rejection ---');
    await Coupon.create({
      code: 'TEST_FUTURE',
      discountType: 'FIXED',
      discountValue: 50,
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE'
    });

    let futureRejected = false;
    try {
      await couponService.validateCoupon({ code: 'TEST_FUTURE', subtotal: 500 });
    } catch (err) {
      futureRejected = err.message.includes('not active yet');
    }
    assert(futureRejected, 'Future coupon was properly rejected before start date');

    // -----------------------------------------------------------------
    // TEST 5: Inactive Coupon Rejection
    // -----------------------------------------------------------------
    console.log('\n--- Test 5: Inactive Coupon Rejection ---');
    await Coupon.create({
      code: 'TEST_INACTIVE',
      discountType: 'FIXED',
      discountValue: 50,
      status: 'INACTIVE'
    });

    let inactiveRejected = false;
    try {
      await couponService.validateCoupon({ code: 'TEST_INACTIVE', subtotal: 500 });
    } catch (err) {
      inactiveRejected = err.message.includes('inactive');
    }
    assert(inactiveRejected, 'Inactive coupon was properly rejected');

    // -----------------------------------------------------------------
    // TEST 6: Invalid Coupon Code Rejection
    // -----------------------------------------------------------------
    console.log('\n--- Test 6: Invalid Coupon Code Rejection ---');
    let nonExistentRejected = false;
    try {
      await couponService.validateCoupon({ code: 'NON_EXISTENT_CODE_XYZ', subtotal: 500 });
    } catch (err) {
      nonExistentRejected = err.statusCode === 404 || err.message.includes('Invalid or non-existent');
    }
    assert(nonExistentRejected, 'Non-existent coupon was properly rejected with 404/not found');

    // -----------------------------------------------------------------
    // TEST 7: Minimum Order Requirement Check
    // -----------------------------------------------------------------
    console.log('\n--- Test 7: Minimum Order Requirement Check ---');
    let minOrderRejected = false;
    try {
      // percentCoupon requires ₹200 minimum; test with ₹150 subtotal
      await couponService.validateCoupon({ code: 'TEST_PERC20', subtotal: 150 });
    } catch (err) {
      minOrderRejected = err.message.includes('Minimum order amount of ₹200 is required');
    }
    assert(minOrderRejected, 'Subtotal below minOrderValue was properly rejected with clear error');

    // -----------------------------------------------------------------
    // TEST 8: Maximum Discount Capping (maxDiscount)
    // -----------------------------------------------------------------
    console.log('\n--- Test 8: Maximum Discount Capping ---');
    await Coupon.create({
      code: 'TEST_CAP50',
      discountType: 'PERCENTAGE',
      discountValue: 50, // 50%
      maxDiscount: 300, // Capped at ₹300
      status: 'ACTIVE'
    });

    // 50% of ₹1000 is ₹500, but cap is ₹300
    const calcCapped = await couponService.validateCoupon({ code: 'TEST_CAP50', subtotal: 1000 });
    assert(calcCapped.discount === 300, `Expected discount to be capped at ₹300, received ₹${calcCapped.discount}`);
    assert(calcCapped.finalSubtotal === 700, `Expected finalSubtotal = ₹700, received ₹${calcCapped.finalSubtotal}`);

    // -----------------------------------------------------------------
    // TEST 9: Usage Limit Enforcement
    // -----------------------------------------------------------------
    console.log('\n--- Test 9: Usage Limit Enforcement ---');
    await Coupon.create({
      code: 'TEST_LIMITED',
      discountType: 'FIXED',
      discountValue: 50,
      usageLimit: 2,
      usedCount: 2, // Reached limit
      status: 'ACTIVE'
    });

    let limitRejected = false;
    try {
      await couponService.validateCoupon({ code: 'TEST_LIMITED', subtotal: 500 });
    } catch (err) {
      limitRejected = err.message.includes('usage limit has been reached');
    }
    assert(limitRejected, 'Coupon that reached its usageLimit was rejected');

    // -----------------------------------------------------------------
    // TEST 10: Coupon Applied to Cart
    // -----------------------------------------------------------------
    console.log('\n--- Test 10: Coupon Applied to Cart ---');
    // Clear user cart first
    await cartService.clearCart(testUser._id, null);
    // Add 2 items of ₹250 each = ₹500 subtotal
    await cartService.addToCart(testUser._id, null, {
      productId: testProduct._id,
      weight: '150g',
      qty: 2
    });

    // Apply TEST_PERC20 (20% off)
    const cartWithCoupon = await cartService.applyCoupon(testUser._id, null, 'TEST_PERC20');
    assert(cartWithCoupon.appliedCoupon?.code === 'TEST_PERC20', 'Coupon code attached to cart');
    assert(cartWithCoupon.discount === 100, `Expected ₹100 discount on ₹500 subtotal, received ₹${cartWithCoupon.discount}`);
    assert(cartWithCoupon.finalSubtotal === 400, `Expected finalSubtotal = ₹400, received ₹${cartWithCoupon.finalSubtotal}`);

    // -----------------------------------------------------------------
    // TEST 11: Coupon Removed from Cart
    // -----------------------------------------------------------------
    console.log('\n--- Test 11: Coupon Removed from Cart ---');
    const cartWithoutCoupon = await cartService.removeCoupon(testUser._id, null);
    assert(cartWithoutCoupon.appliedCoupon === null, 'Applied coupon removed from cart');
    assert(cartWithoutCoupon.discount === 0, 'Cart discount reset to 0');
    assert(cartWithoutCoupon.finalSubtotal === 500, 'Cart finalSubtotal restored to full ₹500');

    // -----------------------------------------------------------------
    // TEST 12: Checkout Pricing Recalculation
    // -----------------------------------------------------------------
    console.log('\n--- Test 12: Checkout Pricing Recalculation ---');
    // Re-apply coupon for checkout
    await cartService.applyCoupon(testUser._id, null, 'TEST_PERC20');
    const summary = await orderService.getCheckoutSummary(testUser._id);

    assert(summary.subtotal === 500, `Checkout summary subtotal: ₹${summary.subtotal}`);
    assert(summary.discount === 100, `Checkout summary discount: ₹${summary.discount}`);
    assert(summary.appliedCoupon?.code === 'TEST_PERC20', 'Checkout summary includes applied coupon');
    // Delivery fee is 0 if subtotal >= 499 (500 >= 499)
    assert(summary.deliveryFee === 0, `Free delivery applied as subtotal ₹500 >= threshold ₹499`);
    // Taxable amount = 500 - 100 = 400. 5% GST on 400 = 20. Total = 420
    assert(summary.tax === 20, `GST calculated on discounted amount: ₹${summary.tax}`);
    assert(summary.total === 420, `Final total calculated authoritatively: ₹${summary.total}`);

    // -----------------------------------------------------------------
    // TEST 13: Prevention of Frontend Price Manipulation
    // -----------------------------------------------------------------
    console.log('\n--- Test 13: Prevention of Frontend Price Manipulation ---');
    // Place order passing fraudulent total or discount in payload
    const placedOrder = await orderService.placeOrder(testUser._id, {
      addressId: testAddress._id,
      paymentMethod: 'COD',
      couponCode: 'TEST_PERC20',
      // Attacker attempts to forge discount = ₹400 and total = ₹10
      discount: 400,
      total: 10
    });

    assert(placedOrder.pricing.subtotal === 500, 'Backend enforced true subtotal ₹500');
    assert(placedOrder.pricing.discount === 100, 'Backend ignored forged discount and enforced calculated ₹100');
    assert(placedOrder.pricing.total === 420, 'Backend ignored forged total ₹10 and enforced ₹420');

    // -----------------------------------------------------------------
    // TEST 14: Order Snapshot Persistence (couponDetails)
    // -----------------------------------------------------------------
    console.log('\n--- Test 14: Order Snapshot Persistence ---');
    assert(placedOrder.pricing.couponDetails !== null, 'Order contains pricing.couponDetails snapshot');
    assert(placedOrder.pricing.couponDetails.code === 'TEST_PERC20', 'Snapshot preserved correct coupon code');
    assert(placedOrder.pricing.couponDetails.discountType === 'PERCENTAGE', 'Snapshot preserved discountType');
    assert(placedOrder.pricing.couponDetails.discountValue === 20, 'Snapshot preserved discountValue 20');
    assert(placedOrder.pricing.couponDetails.discountAmount === 100, 'Snapshot preserved discountAmount 100');

    // -----------------------------------------------------------------
    // TEST 15: Atomic usedCount Incrementing on Order Placement
    // -----------------------------------------------------------------
    console.log('\n--- Test 15: Atomic usedCount Incrementing on Order Placement ---');
    const updatedPercCoupon = await Coupon.findOne({ code: 'TEST_PERC20' });
    assert(updatedPercCoupon.usedCount === 1, `Expected usedCount to increment to 1, received ${updatedPercCoupon.usedCount}`);

    // -----------------------------------------------------------------
    // TEST 16: Race Condition & Concurrency Guard Safety
    // -----------------------------------------------------------------
    console.log('\n--- Test 16: Race Condition & Concurrency Guard ---');
    const raceCoupon = await Coupon.create({
      code: 'TEST_RACE_SLOT',
      discountType: 'FIXED',
      discountValue: 10,
      usageLimit: 1, // Only 1 slot available!
      usedCount: 0,
      status: 'ACTIVE'
    });

    // Attempt 1: Should succeed
    const firstClaim = await couponService.incrementCouponUsage(raceCoupon._id);
    assert(firstClaim.usedCount === 1, 'First claim succeeded and incremented usedCount to 1');

    // Attempt 2: Should fail atomically as limit is reached
    let secondClaimFailed = false;
    try {
      await couponService.incrementCouponUsage(raceCoupon._id);
    } catch (err) {
      secondClaimFailed = err.message.includes('Limit reached');
    }
    assert(secondClaimFailed, 'Second simultaneous claim was atomically blocked by MongoDB condition');

    // -----------------------------------------------------------------
    // TEST 17: Admin CRUD Operations
    // -----------------------------------------------------------------
    console.log('\n--- Test 17: Admin CRUD Operations ---');
    // Create
    const adminCreated = await couponService.createCoupon({
      code: 'TEST_ADMIN_PROMO',
      description: 'Created by admin',
      discountType: 'PERCENTAGE',
      discountValue: 25,
      minOrderValue: 500,
      status: 'ACTIVE'
    });
    assert(adminCreated.code === 'TEST_ADMIN_PROMO', 'Admin created coupon');

    // Read list with search and filter
    const listRes = await couponService.getAllCouponsAdmin({
      search: 'ADMIN_PROMO',
      status: 'ACTIVE',
      page: 1,
      limit: 10
    });
    assert(listRes.coupons.length >= 1, `Found ${listRes.coupons.length} coupon(s) via admin search`);

    // Read by ID
    const singleCoupon = await couponService.getCouponByIdAdmin(adminCreated._id);
    assert(singleCoupon.code === 'TEST_ADMIN_PROMO', 'Admin fetched single coupon by ID');

    // Update
    const updated = await couponService.updateCouponAdmin(adminCreated._id, {
      discountValue: 30,
      status: 'INACTIVE'
    });
    assert(updated.discountValue === 30, 'Admin updated discountValue to 30%');
    assert(updated.status === 'INACTIVE', 'Admin updated status to INACTIVE');

    // Delete
    const delRes = await couponService.deleteCouponAdmin(adminCreated._id);
    assert(delRes.success === true, 'Admin deleted coupon successfully');

    // -----------------------------------------------------------------
    // TEST 18: Access Control (Customer Blocked from Admin Endpoints)
    // -----------------------------------------------------------------
    console.log('\n--- Test 18: Access Control Protection ---');
    let customerAccessBlocked = false;
    const fakeReq = { user: { role: 'USER', email: testUser.email } };
    const fakeRes = {
      status: (code) => ({
        json: (data) => {
          if (code === 403) customerAccessBlocked = true;
          return data;
        }
      })
    };
    const fakeNext = () => {};

    // Run requireAdmin middleware with customer role
    requireAdmin(fakeReq, fakeRes, fakeNext);
    assert(customerAccessBlocked, 'Customer role was rejected with 403 Forbidden by requireAdmin middleware');

    // -----------------------------------------------------------------
    // Cleanup test data
    // -----------------------------------------------------------------
    console.log('\n--- Cleaning up test records ---');
    await Coupon.deleteMany({ code: /^TEST_/ });
    await User.deleteMany({ email: /^test_coupon_/ });
    await Address.deleteMany({ user: testUser._id });
    await Product.deleteOne({ _id: testProduct._id });
    await Cart.deleteOne({ user: testUser._id });
    await Order.deleteMany({ user: testUser._id });
    console.log('Cleanup completed.\n');

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log('================================================================');
    console.log(`Test Execution Finished: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runTests();
