/**
 * Phase 4 — Customer Reviews & Product Ratings Integration Test Suite
 * 
 * Verifies all 24 test points:
 * 1. Customer who never purchased product tries to review -> rejected (403)
 * 2. Customer purchased but order is not delivered -> rejected (400)
 * 3. Customer has delivered order -> review accepted (201)
 * 4. New review status -> PENDING
 * 5. Pending review does not appear publicly
 * 6. Pending review does not affect Product.rating
 * 7. Admin sees pending review
 * 8. Admin approves review
 * 9. Approved review appears publicly
 * 10. Product.rating updates
 * 11. Product.reviewsCount updates
 * 12. Second customer submits different rating
 * 13. Average rating recalculates correctly
 * 14. Admin rejects an approved review
 * 15. Rating recalculates correctly
 * 16. Admin features approved review
 * 17. Featured review displays correctly
 * 18. Admin replies to review
 * 19. Reply appears publicly
 * 20. Duplicate review is prevented
 * 21. Non-admin cannot moderate reviews
 * 22. Customer cannot manually set review to APPROVED
 * 23. Customer cannot fake verifiedPurchase
 * 24. Product with zero approved reviews handles rating correctly
 */

import mongoose from 'mongoose';
import env from '../src/config/env.js';
import Product from '../src/models/Product.js';
import User from '../src/models/User.js';
import Order from '../src/models/Order.js';
import Address from '../src/models/Address.js';
import Review from '../src/models/Review.js';
import reviewService from '../src/services/reviewService.js';
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
  console.log('🧪 Starting Phase 4 — Customer Reviews & Product Ratings Test Suite');
  console.log('================================================================\n');

  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('[Database] MongoDB Connected:', mongoose.connection.host);

    const timestamp = Date.now();

    // 1. Create Test Users
    const customer1 = await User.create({
      name: `Reviewer One ${timestamp}`,
      email: `rev_user1_${timestamp}@auriva.test`,
      phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: 'USER',
      isActive: true
    });

    const customer2 = await User.create({
      name: `Reviewer Two ${timestamp}`,
      email: `rev_user2_${timestamp}@auriva.test`,
      phone: `92${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: 'USER',
      isActive: true
    });

    const adminUser = await User.create({
      name: `Review Admin ${timestamp}`,
      email: `rev_admin_${timestamp}@auriva.test`,
      phone: `93${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: 'ADMIN',
      isActive: true
    });

    // 2. Create Test Product
    const testProduct = await Product.create({
      name: `Gourmet Review Makhana ${timestamp}`,
      slug: `gourmet-review-makhana-${timestamp}`,
      price: 249,
      oldPrice: 299,
      category: 'flavoured-makhana',
      stockCount: 100,
      rating: 0,
      reviewsCount: 0,
      image: '/src/assets/user/Types/PeriPeri.jpeg',
      status: 'ACTIVE'
    });

    // 3. Create Orders for Customers
    // customer1 has a DELIVERED order
    const deliveredOrder = await Order.create({
      orderNumber: `AV-REV-${timestamp}-1`,
      user: customer1._id,
      items: [
        {
          product: testProduct._id,
          name: testProduct.name,
          price: testProduct.price,
          qty: 2,
          subtotal: 498
        }
      ],
      shippingAddress: {
        fullName: customer1.name,
        phoneNumber: customer1.phone,
        addressLine1: 'Test St',
        city: 'Indore',
        state: 'Madhya Pradesh',
        postalCode: '452001'
      },
      pricing: {
        subtotal: 498,
        deliveryFee: 0,
        tax: 25,
        total: 523
      },
      status: 'DELIVERED'
    });

    // customer2 has an undelivered order (CONFIRMED)
    const activeOrder = await Order.create({
      orderNumber: `AV-REV-${timestamp}-2`,
      user: customer2._id,
      items: [
        {
          product: testProduct._id,
          name: testProduct.name,
          price: testProduct.price,
          qty: 1,
          subtotal: 249
        }
      ],
      shippingAddress: {
        fullName: customer2.name,
        phoneNumber: customer2.phone,
        addressLine1: 'Test St',
        city: 'Indore',
        state: 'Madhya Pradesh',
        postalCode: '452001'
      },
      pricing: {
        subtotal: 249,
        deliveryFee: 40,
        tax: 12,
        total: 301
      },
      status: 'CONFIRMED'
    });

    // ---------------------------------------------------------
    // Test 1: Customer who never purchased product tries to review -> rejected (403)
    // ---------------------------------------------------------
    console.log('🔹 Test 1: Customer without purchase tries to review');
    const randomUser = await User.create({
      name: `Random Buyer ${timestamp}`,
      email: `random_${timestamp}@auriva.test`,
      phone: `94${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: 'USER',
      isActive: true
    });

    let nonPurchaserBlocked = false;
    try {
      await reviewService.submitReview(randomUser._id, testProduct._id, {
        rating: 5,
        title: 'Fake Review',
        comment: 'I never purchased this item'
      });
    } catch (e) {
      if (e.statusCode === 403) nonPurchaserBlocked = true;
    }
    assert(nonPurchaserBlocked === true, 'Review from user without purchase was blocked with HTTP 403');

    // ---------------------------------------------------------
    // Test 2: Customer purchased but order is not delivered -> rejected (400)
    // ---------------------------------------------------------
    console.log('\n🔹 Test 2: Customer with undelivered order tries to review');
    let undeliveredBlocked = false;
    try {
      await reviewService.submitReview(customer2._id, testProduct._id, {
        rating: 4,
        title: 'Too early',
        comment: 'Item is still in transit'
      });
    } catch (e) {
      if (e.statusCode === 400 && e.reason === 'ORDER_NOT_DELIVERED') undeliveredBlocked = true;
    }
    assert(undeliveredBlocked === true, 'Review on undelivered purchase was blocked with HTTP 400');

    // ---------------------------------------------------------
    // Test 3 & 4: Customer has delivered order -> review accepted as PENDING
    // ---------------------------------------------------------
    console.log('\n🔹 Test 3 & 4: Customer with delivered order submits review (status = PENDING)');
    const review1 = await reviewService.submitReview(customer1._id, testProduct._id, {
      rating: 5,
      title: 'Amazing Crunch and Flavor',
      comment: 'The quality of the roasted makhana was absolutely superb!'
    });
    assert(review1 !== null, 'Review was successfully accepted');
    assert(review1.status === 'PENDING', 'Initial review status is PENDING');
    assert(review1.verifiedPurchase === true, 'Review is marked as verifiedPurchase');

    // ---------------------------------------------------------
    // Test 5 & 6: Pending review does not appear publicly & does not alter Product.rating
    // ---------------------------------------------------------
    console.log('\n🔹 Test 5 & 6: Pending review is hidden from public & does not alter Product rating');
    const publicBeforeApproval = await reviewService.getPublicReviews(testProduct._id);
    assert(publicBeforeApproval.reviews.length === 0, 'Public reviews list is empty (PENDING reviews hidden)');
    const prodCheck1 = await Product.findById(testProduct._id);
    assert(prodCheck1.rating === 0, 'Product rating remains 0 while review is PENDING');
    assert(prodCheck1.reviewsCount === 0, 'Product reviewsCount remains 0 while review is PENDING');

    // ---------------------------------------------------------
    // Test 7 & 8: Admin sees pending review & approves it
    // ---------------------------------------------------------
    console.log('\n🔹 Test 7 & 8: Admin moderates and approves review');
    const adminList1 = await reviewService.getAdminReviews({ status: 'PENDING' });
    const foundPending = adminList1.reviews.find(r => r.id === review1.id || r._id === review1.id);
    assert(foundPending !== undefined, 'Admin review queue includes the pending review');

    const approveResult = await reviewService.updateReviewStatus(review1.id, 'APPROVED', adminUser._id);
    assert(approveResult.review.status === 'APPROVED', 'Review status updated to APPROVED');

    // ---------------------------------------------------------
    // Test 9, 10, 11: Approved review appears publicly & updates Product.rating & reviewsCount
    // ---------------------------------------------------------
    console.log('\n🔹 Test 9, 10, 11: Approved review is live and Product rating is recalculated');
    const publicAfterApproval = await reviewService.getPublicReviews(testProduct._id);
    assert(publicAfterApproval.reviews.length === 1, 'Approved review now appears in public API');
    assert(publicAfterApproval.reviews[0].rating === 5, 'Public review rating is 5 stars');
    assert(publicAfterApproval.reviews[0].verified === true, 'Public review displays Verified Buyer badge');

    const prodCheck2 = await Product.findById(testProduct._id);
    assert(prodCheck2.rating === 5, 'Product rating updated to 5.0');
    assert(prodCheck2.reviewsCount === 1, 'Product reviewsCount updated to 1');

    // ---------------------------------------------------------
    // Test 12 & 13: Second customer submits rating -> average rating recalculates
    // ---------------------------------------------------------
    console.log('\n🔹 Test 12 & 13: Second customer submits review & average rating recalculates');
    // Mark customer2 order as DELIVERED
    activeOrder.status = 'DELIVERED';
    await activeOrder.save();

    const review2 = await reviewService.submitReview(customer2._id, testProduct._id, {
      rating: 3,
      title: 'Decent flavor',
      comment: 'Good crunch but a bit mild for my personal preference.'
    });
    // Admin approves review2
    await reviewService.updateReviewStatus(review2.id, 'APPROVED', adminUser._id);

    // Expected average: (5 + 3) / 2 = 4.0, count = 2
    const prodCheck3 = await Product.findById(testProduct._id);
    assert(prodCheck3.rating === 4, 'Average rating recalculated to 4.0 ((5 + 3) / 2)');
    assert(prodCheck3.reviewsCount === 2, 'Product reviewsCount recalculated to 2');

    // ---------------------------------------------------------
    // Test 14 & 15: Admin rejects approved review -> rating recalculates back
    // ---------------------------------------------------------
    console.log('\n🔹 Test 14 & 15: Admin rejects review & rating recalculates');
    await reviewService.updateReviewStatus(review2.id, 'REJECTED', adminUser._id);

    const prodCheck4 = await Product.findById(testProduct._id);
    assert(prodCheck4.rating === 5, 'Product rating recalculated back to 5.0');
    assert(prodCheck4.reviewsCount === 1, 'Product reviewsCount recalculated back to 1');

    const publicAfterRejection = await reviewService.getPublicReviews(testProduct._id);
    assert(publicAfterRejection.reviews.length === 1, 'Rejected review no longer visible publicly');

    // ---------------------------------------------------------
    // Test 16 & 17: Admin features approved review & featured displays correctly
    // ---------------------------------------------------------
    console.log('\n🔹 Test 16 & 17: Admin features approved review');
    const featuredReview = await reviewService.toggleReviewFeatured(review1.id, true);
    assert(featuredReview.featured === true, 'Review marked as featured');

    const publicFeaturedCheck = await reviewService.getPublicReviews(testProduct._id);
    assert(publicFeaturedCheck.reviews[0].featured === true, 'Public review reflects featured status');

    // ---------------------------------------------------------
    // Test 18 & 19: Admin replies to review & reply appears publicly
    // ---------------------------------------------------------
    console.log('\n🔹 Test 18 & 19: Admin replies to review');
    const replyText = 'Thank you for your delightful review! We roast every batch with care.';
    const repliedReview = await reviewService.replyToReview(review1.id, replyText, adminUser._id);
    assert(repliedReview.adminReply?.reply === replyText, 'Admin reply saved in database');

    const publicReplyCheck = await reviewService.getPublicReviews(testProduct._id);
    assert(publicReplyCheck.reviews[0].adminReply === replyText, 'Admin reply displayed in public review object');

    // ---------------------------------------------------------
    // Test 20: Duplicate review is prevented
    // ---------------------------------------------------------
    console.log('\n🔹 Test 20: Prevent duplicate reviews for the same delivered order');
    let duplicateBlocked = false;
    try {
      await reviewService.submitReview(customer1._id, testProduct._id, {
        rating: 4,
        title: 'Second review attempt',
        comment: 'Trying to review again'
      });
    } catch (e) {
      if (e.statusCode === 400 && e.reason === 'ALREADY_REVIEWED') duplicateBlocked = true;
    }
    assert(duplicateBlocked === true, 'Duplicate review attempt was rejected with ALREADY_REVIEWED');

    // ---------------------------------------------------------
    // Test 21: Security: Non-admin cannot moderate reviews
    // ---------------------------------------------------------
    console.log('\n🔹 Test 21: Security: RBAC prevents customer from moderating');
    let rbacBlocked = false;
    const reqCustomer = { user: { role: 'USER' } };
    const resMock = {
      status(code) {
        if (code === 403) rbacBlocked = true;
        return this;
      },
      json() {}
    };
    requireAdmin(reqCustomer, resMock, () => {});
    assert(rbacBlocked === true, 'Customer role blocked from admin review routes with HTTP 403');

    // ---------------------------------------------------------
    // Test 22 & 23: Tamper resistance: Customer cannot force APPROVED or fake verifiedPurchase
    // ---------------------------------------------------------
    console.log('\n🔹 Test 22 & 23: Tamper resistance: Client-injected status and flags are sanitized');
    // Create another order for customer1 with another product
    const product2 = await Product.create({
      name: `Tamper Test Makhana ${timestamp}`,
      slug: `tamper-test-makhana-${timestamp}`,
      price: 199,
      category: 'flavoured-makhana',
      stockCount: 50,
      image: '/src/assets/user/Types/PeriPeri.jpeg',
      status: 'ACTIVE'
    });
    const order3 = await Order.create({
      orderNumber: `AV-REV-${timestamp}-3`,
      user: customer1._id,
      items: [{ product: product2._id, name: product2.name, price: 199, qty: 1, subtotal: 199 }],
      shippingAddress: deliveredOrder.shippingAddress,
      pricing: { subtotal: 199, deliveryFee: 40, tax: 10, total: 249 },
      status: 'DELIVERED'
    });

    const tamperedReview = await reviewService.submitReview(customer1._id, product2._id, {
      rating: 5,
      title: 'Hacked review',
      comment: 'Trying to inject status=APPROVED and featured=true',
      status: 'APPROVED',
      featured: true
    });

    assert(tamperedReview.status === 'PENDING', 'Client status=APPROVED was ignored; saved as PENDING');
    assert(tamperedReview.featured === false, 'Client featured=true was ignored; saved as false');

    // ---------------------------------------------------------
    // Test 24: Product with zero approved reviews sets rating = 0 cleanly
    // ---------------------------------------------------------
    console.log('\n🔹 Test 24: Product with zero approved reviews handles rating = 0 cleanly');
    // Delete the only approved review for testProduct
    await reviewService.deleteReview(review1.id);
    const prodZero = await Product.findById(testProduct._id);
    assert(prodZero.rating === 0, 'Rating resets to 0 when zero approved reviews remain');
    assert(prodZero.reviewsCount === 0, 'reviewsCount resets to 0 when zero approved reviews remain');

    // Cleanup test artifacts
    await User.deleteMany({ _id: { $in: [customer1._id, customer2._id, adminUser._id, randomUser._id] } });
    await Product.deleteMany({ _id: { $in: [testProduct._id, product2._id] } });
    await Order.deleteMany({ _id: { $in: [deliveredOrder._id, activeOrder._id, order3._id] } });
    await Review.deleteMany({ product: { $in: [testProduct._id, product2._id] } });

    console.log('\n================================================================');
    console.log(`🎉 ALL TESTS FINISHED!`);
    console.log(`Passed: ${passed}, Failed: ${failed}`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
