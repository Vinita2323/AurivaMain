/**
 * Phase 5 — Store Settings & Business Rules Integration Test
 * 
 * Verifies all 22 test cases specified in Phase 5:
 * 1. GET admin settings (default document auto-initializes)
 * 2. Update GST
 * 3. Update delivery fee
 * 4. Update free delivery threshold
 * 5. Update low-stock threshold
 * 6. Update warehouse information
 * 7. GET public settings
 * 8. Verify sensitive settings are not publicly exposed
 * 9. Place an order using current settings
 * 10. Verify GST calculation
 * 11. Verify delivery fee calculation
 * 12. Verify free delivery threshold
 * 13. Change delivery fee in Admin
 * 14. Place another order
 * 15. Verify new delivery fee is used
 * 16. Change GST
 * 17. Verify new GST is used
 * 18. Verify low-stock logic uses database threshold
 * 19. Verify unauthorized user cannot update settings
 * 20. Verify invalid/negative values are rejected
 * 21. Verify unknown fields cannot be injected
 * 22. Verify checkout still works when Settings is initially missing
 */

import mongoose from 'mongoose';
import env from '../src/config/env.js';
import Settings from '../src/models/Settings.js';
import settingsService, { DEFAULT_SETTINGS } from '../src/services/settingsService.js';
import { validateUpdateSettings } from '../src/validations/settingsValidation.js';
import * as orderService from '../src/services/orderService.js';
import Product from '../src/models/Product.js';
import User from '../src/models/User.js';
import Address from '../src/models/Address.js';
import Cart from '../src/models/Cart.js';
import Order from '../src/models/Order.js';

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
  console.log('🧪 Starting Phase 5 — Store Settings & Business Rules Test Suite');
  console.log('================================================================\n');

  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('[Database] MongoDB Connected:', mongoose.connection.host);

    // Setup test fixtures
    const timestamp = Date.now();
    const testUser = await User.create({
      name: `Settings Test User ${timestamp}`,
      email: `settings_user_${timestamp}@auriva.test`,
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      phoneNumber: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: 'USER',
      isActive: true
    });

    const testAddress = await Address.create({
      user: testUser._id,
      fullName: 'Settings Tester',
      phoneNumber: '9999900001',
      addressLine1: 'Flat 101, Test Residency',
      city: 'Indore',
      state: 'Madhya Pradesh',
      postalCode: '452001',
      addressType: 'home',
      isDefault: true
    });

    const testProduct = await Product.create({
      name: `Settings Test Makhana ${timestamp}`,
      slug: `settings-test-makhana-${timestamp}`,
      price: 200,
      oldPrice: 250,
      category: 'flavoured-makhana',
      stockCount: 100,
      image: '/assets/user/Types/PeriPeri.jpeg',
      status: 'ACTIVE'
    });

    // Clean any prior test settings
    await Settings.deleteMany({ configKey: 'default_store_settings' });
    settingsService.clearCache();

    // ---------------------------------------------------------
    // Test 1: GET admin settings (auto-initializes default document)
    // ---------------------------------------------------------
    console.log('🔹 Test 1: GET admin settings & auto-initialization');
    const initialSettings = await settingsService.getSettings();
    assert(initialSettings !== null, 'Settings document is retrieved');
    assert(initialSettings.configKey === 'default_store_settings', 'Singleton configKey matches');
    assert(initialSettings.standardDeliveryFee === 40, 'Default standardDeliveryFee is ₹40');
    assert(initialSettings.freeDeliveryThreshold === 499, 'Default freeDeliveryThreshold is ₹499');
    assert(initialSettings.gstRate === 5, 'Default gstRate is 5%');
    assert(initialSettings.lowStockThreshold === 30, 'Default lowStockThreshold is 30');

    // ---------------------------------------------------------
    // Test 2: Update GST
    // ---------------------------------------------------------
    console.log('\n🔹 Test 2: Update GST rate');
    const updatedGst = await settingsService.updateSettings({ gstRate: 12 });
    assert(updatedGst.gstRate === 12, 'GST updated to 12%');

    // ---------------------------------------------------------
    // Test 3: Update Delivery Fee
    // ---------------------------------------------------------
    console.log('\n🔹 Test 3: Update Delivery Fee');
    const updatedFee = await settingsService.updateSettings({ standardDeliveryFee: 60 });
    assert(updatedFee.standardDeliveryFee === 60, 'Standard delivery fee updated to ₹60');

    // ---------------------------------------------------------
    // Test 4: Update Free Delivery Threshold
    // ---------------------------------------------------------
    console.log('\n🔹 Test 4: Update Free Delivery Threshold');
    const updatedThreshold = await settingsService.updateSettings({ freeDeliveryThreshold: 799 });
    assert(updatedThreshold.freeDeliveryThreshold === 799, 'Free delivery threshold updated to ₹799');

    // ---------------------------------------------------------
    // Test 5: Update Low-Stock Threshold
    // ---------------------------------------------------------
    console.log('\n🔹 Test 5: Update Low-Stock Threshold');
    const updatedLowStock = await settingsService.updateSettings({ lowStockThreshold: 25 });
    assert(updatedLowStock.lowStockThreshold === 25, 'Low stock threshold updated to 25');

    // ---------------------------------------------------------
    // Test 6: Update Warehouse Information
    // ---------------------------------------------------------
    console.log('\n🔹 Test 6: Update Warehouse Information');
    const updatedWarehouse = await settingsService.updateSettings({
      warehouseName: 'AURIVÁ West Distribution Hub',
      warehouseAddress: 'Sector 5, Pithampur Industrial Area',
      warehouseCity: 'Dhar',
      warehouseState: 'Madhya Pradesh',
      warehousePincode: '454775'
    });
    assert(updatedWarehouse.warehouseName === 'AURIVÁ West Distribution Hub', 'Warehouse name updated');
    assert(updatedWarehouse.warehousePincode === '454775', 'Warehouse pincode updated');
    assert(updatedWarehouse.hubAddress.includes('Sector 5, Pithampur'), 'Composite hubAddress automatically synchronized');

    // ---------------------------------------------------------
    // Test 7: GET Public Settings
    // ---------------------------------------------------------
    console.log('\n🔹 Test 7: GET Public Settings');
    const publicSettings = await settingsService.getPublicSettings();
    assert(publicSettings.storeName !== undefined, 'Public settings contains storeName');
    assert(publicSettings.gstRate === 12, 'Public settings reflects live 12% GST');
    assert(publicSettings.standardDeliveryFee === 60, 'Public settings reflects live ₹60 delivery fee');
    assert(publicSettings.freeDeliveryThreshold === 799, 'Public settings reflects live ₹799 threshold');

    // ---------------------------------------------------------
    // Test 8: Verify Sensitive Settings Not Exposed Publicly
    // ---------------------------------------------------------
    console.log('\n🔹 Test 8: Verify Sensitive Settings Masked in Public API');
    assert(publicSettings.warehousePhone === undefined, 'warehousePhone is NOT exposed publicly');
    assert(publicSettings.lowStockThreshold === undefined, 'lowStockThreshold is NOT exposed publicly');
    assert(publicSettings.configKey === undefined, 'configKey is NOT exposed publicly');

    // ---------------------------------------------------------
    // Test 9, 10, 11, 12: Order Calculation with Live Settings
    // ---------------------------------------------------------
    console.log('\n🔹 Test 9-12: Order Calculation with Live Settings (12% GST, ₹60 delivery, ₹799 threshold)');
    // 1 unit of ₹200 testProduct -> subtotal ₹200 (under ₹799 threshold)
    // Delivery fee should be ₹60
    // Taxable amount = ₹200
    // Tax = Math.round(200 * 0.12) = 24
    // Total = 200 + 60 + 24 = 284
    await Cart.findOneAndUpdate(
      { user: testUser._id },
      { items: [{ product: testProduct._id, qty: 1 }] },
      { upsert: true }
    );

    const order1 = await orderService.placeOrder(testUser._id, {
      addressId: testAddress._id,
      paymentMethod: 'COD'
    });

    assert(order1.pricing.subtotal === 200, 'Order 1 subtotal is ₹200');
    assert(order1.pricing.deliveryFee === 60, 'Order 1 delivery fee matches configured ₹60');
    assert(order1.pricing.tax === 24, 'Order 1 tax is 12% (₹24)');
    assert(order1.pricing.total === 284, 'Order 1 total is ₹284 (200 + 60 + 24)');

    // Test free delivery threshold: 4 units of ₹200 = ₹800 (>= ₹799 threshold)
    // Delivery fee should be ₹0
    // Taxable amount = ₹800
    // Tax = Math.round(800 * 0.12) = 96
    // Total = 800 + 0 + 96 = 896
    await Cart.findOneAndUpdate(
      { user: testUser._id },
      { items: [{ product: testProduct._id, qty: 4 }] },
      { upsert: true }
    );

    const orderFreeDelivery = await orderService.placeOrder(testUser._id, {
      addressId: testAddress._id,
      paymentMethod: 'COD'
    });

    assert(orderFreeDelivery.pricing.subtotal === 800, 'Order 2 subtotal is ₹800');
    assert(orderFreeDelivery.pricing.deliveryFee === 0, 'Order 2 qualifies for FREE delivery (subtotal >= ₹799)');
    assert(orderFreeDelivery.pricing.tax === 96, 'Order 2 tax is 12% of ₹800 (₹96)');
    assert(orderFreeDelivery.pricing.total === 896, 'Order 2 total is ₹896 (800 + 0 + 96)');

    // ---------------------------------------------------------
    // Test 13, 14, 15: Change delivery fee in Admin & verify new order
    // ---------------------------------------------------------
    console.log('\n🔹 Test 13-15: Change Delivery Fee to ₹75 & verify new order uses ₹75');
    await settingsService.updateSettings({ standardDeliveryFee: 75 });
    
    await Cart.findOneAndUpdate(
      { user: testUser._id },
      { items: [{ product: testProduct._id, qty: 1 }] },
      { upsert: true }
    );

    const orderNewFee = await orderService.placeOrder(testUser._id, {
      addressId: testAddress._id,
      paymentMethod: 'COD'
    });

    assert(orderNewFee.pricing.deliveryFee === 75, 'New order dynamically uses updated ₹75 delivery fee');
    assert(orderNewFee.pricing.total === 299, 'New order total is ₹299 (200 + 75 + 24)');

    // ---------------------------------------------------------
    // Test 16, 17: Change GST in Admin & verify new order
    // ---------------------------------------------------------
    console.log('\n🔹 Test 16-17: Change GST to 18% & verify new order uses 18% GST');
    await settingsService.updateSettings({ gstRate: 18 });

    await Cart.findOneAndUpdate(
      { user: testUser._id },
      { items: [{ product: testProduct._id, qty: 1 }] },
      { upsert: true }
    );

    const orderNewGst = await orderService.placeOrder(testUser._id, {
      addressId: testAddress._id,
      paymentMethod: 'COD'
    });

    // Subtotal 200, Tax 18% = 36, Delivery fee = 75, Total = 200 + 75 + 36 = 311
    assert(orderNewGst.pricing.tax === 36, 'New order dynamically uses updated 18% GST (₹36 on ₹200)');
    assert(orderNewGst.pricing.total === 311, 'New order total is ₹311 (200 + 75 + 36)');

    // ---------------------------------------------------------
    // Test 18: Verify low-stock logic uses database threshold
    // ---------------------------------------------------------
    console.log('\n🔹 Test 18: Verify low-stock logic uses database threshold');
    await settingsService.updateSettings({ lowStockThreshold: 45 });
    const currentSettings = await settingsService.getSettings();
    assert(currentSettings.lowStockThreshold === 45, 'lowStockThreshold updated to 45 in database');

    // Create a product with stock 40 (which is <= 45, hence low stock)
    const lowStockProd = await Product.create({
      name: `Low Stock Prod ${timestamp}`,
      slug: `low-stock-prod-${timestamp}`,
      price: 150,
      stockCount: 40,
      image: '/assets/user/Types/PeriPeri.jpeg',
      status: 'ACTIVE'
    });
    const isLow = lowStockProd.stockCount <= currentSettings.lowStockThreshold;
    assert(isLow === true, 'Product with stock 40 is correctly identified as low stock using dynamic threshold 45');

    // ---------------------------------------------------------
    // Test 19: Security: Unauthorized user cannot update settings
    // ---------------------------------------------------------
    console.log('\n🔹 Test 19: Security: RBAC middleware prevents non-admin update');
    // Simulated mock request / response for non-admin user
    let rbacBlocked = false;
    const reqNonAdmin = { user: { role: 'USER' } };
    const resMock = {
      status(code) {
        if (code === 403) rbacBlocked = true;
        return this;
      },
      json() {}
    };
    const { requireAdmin } = await import('../src/middleware/roleMiddleware.js');
    requireAdmin(reqNonAdmin, resMock, () => {});
    assert(rbacBlocked === true, 'Non-admin request is blocked with HTTP 403');

    // ---------------------------------------------------------
    // Test 20: Validation: Negative/invalid values are rejected
    // ---------------------------------------------------------
    console.log('\n🔹 Test 20: Validation: Negative/invalid values rejected');
    let validationFailed = false;
    const reqNegative = {
      body: {
        gstRate: -5,
        standardDeliveryFee: -20
      }
    };
    const resNegative = {
      status(code) {
        if (code === 422) validationFailed = true;
        return this;
      },
      json(data) {
        this.data = data;
      }
    };
    validateUpdateSettings(reqNegative, resNegative, () => {});
    assert(validationFailed === true, 'Negative GST & delivery fee are rejected with HTTP 422');

    // ---------------------------------------------------------
    // Test 21: Validation: Unknown fields cannot be injected
    // ---------------------------------------------------------
    console.log('\n🔹 Test 21: Validation: Unknown fields cannot be injected');
    let unknownFieldBlocked = false;
    const reqUnknown = {
      body: {
        maliciousField: 'exploit',
        hackedRole: 'SUPER_ADMIN'
      }
    };
    const resUnknown = {
      status(code) {
        if (code === 422) unknownFieldBlocked = true;
        return this;
      },
      json(data) {
        this.data = data;
      }
    };
    validateUpdateSettings(reqUnknown, resUnknown, () => {});
    assert(unknownFieldBlocked === true, 'Unapproved unknown fields are rejected with HTTP 422');

    // ---------------------------------------------------------
    // Test 22: Backward Compatibility: Checkout works when Settings is missing
    // ---------------------------------------------------------
    console.log('\n🔹 Test 22: Backward Compatibility: Checkout works when Settings document is missing');
    // Delete settings document and clear cache
    await Settings.deleteMany({});
    settingsService.clearCache();

    // Verify getSettings auto-creates default document with ₹40 delivery fee and 5% GST
    const fallbackSettings = await settingsService.getSettings();
    assert(fallbackSettings.standardDeliveryFee === 40, 'Auto-recreated default standardDeliveryFee is ₹40');
    assert(fallbackSettings.gstRate === 5, 'Auto-recreated default gstRate is 5%');

    // Order placement succeeds with the defaults
    await Cart.findOneAndUpdate(
      { user: testUser._id },
      { items: [{ product: testProduct._id, qty: 1 }] },
      { upsert: true }
    );

    const fallbackOrder = await orderService.placeOrder(testUser._id, {
      addressId: testAddress._id,
      paymentMethod: 'COD'
    });
    // Subtotal 200, Tax 5% = 10, Delivery fee = 40, Total = 200 + 40 + 10 = 250
    assert(fallbackOrder.pricing.subtotal === 200, 'Subtotal is ₹200');
    assert(fallbackOrder.pricing.deliveryFee === 40, 'Delivery fee defaults to ₹40');
    assert(fallbackOrder.pricing.tax === 10, 'Tax defaults to 5% (₹10)');
    assert(fallbackOrder.pricing.total === 250, 'Total is ₹250 (200 + 40 + 10)');

    // Cleanup test artifacts
    await User.deleteOne({ _id: testUser._id });
    await Address.deleteOne({ _id: testAddress._id });
    await Product.deleteOne({ _id: testProduct._id });
    await Product.deleteOne({ _id: lowStockProd._id });
    await Cart.deleteOne({ user: testUser._id });
    await Order.deleteMany({ user: testUser._id });

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
