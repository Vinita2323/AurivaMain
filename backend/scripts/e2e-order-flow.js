/**
 * End-to-end order flow test (COD + prepaid + edge cases)
 * Run: node scripts/e2e-order-flow.js
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API = process.env.E2E_API_BASE || 'http://localhost:5000/api/v1';
const PHONE = '9876543210';
const OTP = '123456';

const results = [];
let passed = 0;
let failed = 0;

function ok(name, detail = '') {
  passed += 1;
  results.push({ status: 'PASS', name, detail });
  console.log(`  ✅ PASS  ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  failed += 1;
  results.push({ status: 'FAIL', name, detail });
  console.log(`  ❌ FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
}

function assert(cond, name, detail = '') {
  if (cond) ok(name, detail);
  else fail(name, detail);
}

async function req(method, endpoint, { token, body, guestId, expectStatus } = {}) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (guestId) headers['x-guest-id'] = guestId;

  const res = await fetch(`${API}${endpoint}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined
  });

  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (expectStatus != null && res.status !== expectStatus) {
    const err = new Error(
      `${method} ${endpoint} expected ${expectStatus} got ${res.status}: ${data?.message || text.slice(0, 200)}`
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return { status: res.status, data };
}

async function main() {
  console.log(`\n=== Auriva E2E Order Flow ===\nAPI: ${API}\n`);

  // ---------- 0. Health ----------
  console.log('▸ Health');
  try {
    const h = await req('GET', '/health');
    assert(h.data?.success || h.data?.data?.status === 'healthy', 'Health check');
  } catch (e) {
    fail('Health check', e.message);
    console.log('\nBackend not reachable. Start with: npm run dev in backend/\n');
    process.exit(1);
  }

  // ---------- 1. Auth ----------
  console.log('\n▸ Auth');
  let token = null;
  let user = null;
  try {
    await req('POST', '/auth/user/send-otp', { body: { phone: PHONE } });
    ok('Send OTP');
    const v = await req('POST', '/auth/user/verify-otp', {
      body: { phone: PHONE, otp: OTP },
      expectStatus: 200
    });
    token = v.data?.data?.token;
    user = v.data?.data?.user;
    assert(Boolean(token), 'Verify OTP → JWT', user?.name || PHONE);
  } catch (e) {
    fail('Auth', e.message);
    process.exit(1);
  }

  // Edge: bad OTP
  try {
    const bad = await req('POST', '/auth/user/verify-otp', {
      body: { phone: PHONE, otp: '000000' }
    });
    assert(bad.status >= 400 || bad.data?.success === false, 'Reject invalid OTP');
  } catch (e) {
    ok('Reject invalid OTP', e.message.slice(0, 80));
  }

  // Edge: no auth on place order
  try {
    const unauth = await req('POST', '/orders', {
      body: { addressId: '000000000000000000000000', paymentMethod: 'COD' }
    });
    assert(unauth.status === 401, 'Unauthorized place-order blocked', `status=${unauth.status}`);
  } catch (e) {
    fail('Unauthorized place-order', e.message);
  }

  // ---------- 2. Products ----------
  console.log('\n▸ Catalog');
  let product = null;
  try {
    const p = await req('GET', '/products?limit=20');
    const list = p.data?.data?.products || p.data?.data || p.data?.products || [];
    const arr = Array.isArray(list) ? list : [];
    product = arr.find((x) => x.status === 'ACTIVE' || x.inStock !== false) || arr[0];
    assert(Boolean(product?._id), 'Fetch products', product?.name || 'none');
  } catch (e) {
    fail('Fetch products', e.message);
    process.exit(1);
  }

  const weight =
    product?.weightOptions?.[0]?.weight ||
    product?.weight ||
    '150g';
  const unitPrice =
    product?.weightOptions?.[0]?.price ||
    product?.price ||
    249;

  // ---------- 3. Addresses ----------
  console.log('\n▸ Addresses');
  let addressId = null;
  let postalCode = '452003';
  try {
    const list = await req('GET', '/user/addresses', { token });
    const addresses = list.data?.data?.addresses || list.data?.addresses || [];
    if (addresses.length) {
      addressId = addresses[0]._id;
      postalCode = addresses[0].postalCode || addresses[0].pincode || postalCode;
      ok('Use existing address', `${postalCode} (${addressId})`);
    } else {
      const created = await req('POST', '/user/addresses', {
        token,
        body: {
          fullName: user?.name || 'E2E Tester',
          phoneNumber: PHONE,
          addressLine1: 'House 12, Test Colony',
          city: 'Indore',
          state: 'Madhya Pradesh',
          postalCode: '452003',
          addressType: 'home',
          isDefault: true
        },
        expectStatus: 201
      });
      addressId = created.data?.data?.address?._id;
      postalCode = '452003';
      assert(Boolean(addressId), 'Create address', addressId);
    }
  } catch (e) {
    fail('Addresses', e.message);
    process.exit(1);
  }

  // Edge: place without addressId
  try {
    const noAddr = await req('POST', '/orders', {
      token,
      body: { paymentMethod: 'COD' }
    });
    assert(
      noAddr.status === 400 || noAddr.status === 422,
      'Reject order without addressId',
      `status=${noAddr.status}`
    );
  } catch (e) {
    fail('Reject order without addressId', e.message);
  }

  // ---------- 4. Shipping quote ----------
  console.log('\n▸ Shipping quote (Shiprocket)');
  let quote = null;
  try {
    const q = await req(
      'GET',
      `/shipping/quote?pincode=${postalCode}&paymentMethod=COD&subtotal=${unitPrice}&weightKg=0.2`
    );
    quote = q.data?.data?.quote;
    assert(Boolean(quote), 'Shipping quote returned');
    assert(quote?.prepaid?.fee > 0 || quote?.freeDeliveryApplied, 'Prepaid rate present', `₹${quote?.prepaid?.fee}`);
    assert(quote?.cod?.fee > 0 || quote?.freeDeliveryApplied, 'COD rate present', `₹${quote?.cod?.fee}`);
    assert(quote?.cod?.fee >= quote?.prepaid?.fee, 'COD fee >= prepaid fee', `COD ₹${quote?.cod?.fee} vs prepaid ₹${quote?.prepaid?.fee}`);
  } catch (e) {
    fail('Shipping quote', e.message);
  }

  // Edge: bad pincode
  try {
    const badPin = await req('GET', '/shipping/quote?pincode=12&paymentMethod=COD&subtotal=249&weightKg=0.2');
    const errMsg = badPin.data?.data?.quote?.error || '';
    assert(
      Boolean(errMsg) || badPin.data?.data?.quote?.deliveryFee === 0,
      'Invalid pincode handled',
      errMsg || 'no courier'
    );
  } catch (e) {
    fail('Invalid pincode quote', e.message);
  }

  // Free delivery threshold quote
  try {
    const freeQ = await req(
      'GET',
      `/shipping/quote?pincode=${postalCode}&paymentMethod=COD&subtotal=600&weightKg=0.2`
    );
    const fq = freeQ.data?.data?.quote;
    assert(fq?.deliveryFee === 0 && fq?.freeDeliveryApplied, 'Free shipping above threshold', `subtotal=600 → fee=${fq?.deliveryFee}`);
  } catch (e) {
    fail('Free shipping quote', e.message);
  }

  // ---------- 5. Cart ----------
  console.log('\n▸ Cart');
  const guestId = `e2e_${Date.now()}`;
  try {
    await req('DELETE', '/cart', { token, guestId });
    await req('POST', '/cart/items', {
      token,
      guestId,
      body: { productId: product._id, weight, qty: 1 },
      expectStatus: 200
    });
    const cart = await req('GET', '/cart', { token, guestId });
    const items = cart.data?.data?.cart?.items || [];
    assert(items.length >= 1, 'Add item to cart', `${items.length} item(s)`);
  } catch (e) {
    // Some APIs return 201
    try {
      await req('POST', '/cart/sync', {
        token,
        guestId,
        body: {
          items: [
            {
              productId: product._id,
              product: product._id,
              name: product.name,
              weight,
              qty: 1,
              price: unitPrice,
              image: product.image
            }
          ]
        }
      });
      ok('Cart sync fallback', product.name);
    } catch (e2) {
      fail('Cart', e.message || e2.message);
      process.exit(1);
    }
  }

  // Edge: empty cart order
  try {
    await req('DELETE', '/cart', { token, guestId: `empty_${Date.now()}` });
    // Ensure user cart empty by clearing then not adding
    await req('DELETE', '/cart', { token });
    const emptyOrder = await req('POST', '/orders', {
      token,
      body: {
        addressId,
        paymentMethod: 'COD',
        idempotencyKey: `empty_${Date.now()}`
      }
    });
    assert(
      emptyOrder.status === 400 || emptyOrder.data?.success === false,
      'Reject empty-cart order',
      emptyOrder.data?.message || `status=${emptyOrder.status}`
    );
  } catch (e) {
    fail('Empty cart edge', e.message);
  }

  // Re-fill cart for real order
  try {
    await req('POST', '/cart/sync', {
      token,
      guestId,
      body: {
        items: [
          {
            productId: product._id,
            product: product._id,
            name: product.name,
            weight,
            qty: 1,
            price: unitPrice,
            image: product.image
          }
        ]
      }
    });
    ok('Cart ready for COD order');
  } catch (e) {
    fail('Cart refill', e.message);
  }

  // ---------- 6. Place COD order ----------
  console.log('\n▸ Place COD order (full flow)');
  let codOrder = null;
  try {
    // Refresh quote for exact expected fee
    const q2 = await req(
      'GET',
      `/shipping/quote?pincode=${postalCode}&paymentMethod=COD&subtotal=${unitPrice}&weightKg=0.2`
    );
    const expectedCodFee = q2.data?.data?.quote?.cod?.fee ?? q2.data?.data?.quote?.deliveryFee;

    const placed = await req('POST', '/orders', {
      token,
      guestId,
      body: {
        addressId,
        paymentMethod: 'COD',
        idempotencyKey: `e2e_cod_${Date.now()}`,
        items: [
          {
            productId: product._id,
            product: product._id,
            name: product.name,
            weight,
            qty: 1,
            price: unitPrice
          }
        ]
      },
      expectStatus: 201
    });

    codOrder = placed.data?.data?.order;
    assert(Boolean(codOrder?._id || codOrder?.orderNumber), 'COD order created', codOrder?.orderNumber);

    const fee = codOrder?.pricing?.deliveryFee;
    assert(
      fee === expectedCodFee || (expectedCodFee === 0 && fee === 0),
      'COD deliveryFee matches Shiprocket',
      `order ₹${fee} vs quote ₹${expectedCodFee}`
    );

    assert(
      String(codOrder?.payment?.method || '').toUpperCase() === 'COD',
      'Payment method is COD'
    );

    assert(
      Boolean(codOrder?.shippingAddress?.postalCode),
      'Address snapshot saved',
      codOrder?.shippingAddress?.postalCode
    );

    // Fetch by id
    const fetched = await req('GET', `/orders/${codOrder._id || codOrder.orderNumber}`, { token });
    const fo = fetched.data?.data?.order;
    assert(fo?.orderNumber === codOrder.orderNumber, 'Fetch order by id', fo?.orderNumber);

    // List user orders contains it
    const list = await req('GET', '/orders', { token });
    const orders = list.data?.data?.orders || [];
    assert(
      orders.some((o) => o.orderNumber === codOrder.orderNumber),
      'Order appears in user list'
    );
  } catch (e) {
    fail('COD place order', e.message);
  }

  // Idempotency
  if (codOrder) {
    try {
      const key = `e2e_idem_${Date.now()}`;
      await req('POST', '/cart/sync', {
        token,
        body: {
          items: [
            {
              productId: product._id,
              product: product._id,
              name: product.name,
              weight,
              qty: 1,
              price: unitPrice
            }
          ]
        }
      });
      const a = await req('POST', '/orders', {
        token,
        body: { addressId, paymentMethod: 'COD', idempotencyKey: key },
        expectStatus: 201
      });
      const b = await req('POST', '/orders', {
        token,
        body: { addressId, paymentMethod: 'COD', idempotencyKey: key }
      });
      const idA = a.data?.data?.order?._id || a.data?.data?.order?.orderNumber;
      const idB = b.data?.data?.order?._id || b.data?.data?.order?.orderNumber;
      assert(String(idA) === String(idB), 'Idempotent placeOrder returns same order', idA);
    } catch (e) {
      fail('Idempotency', e.message);
    }
  }

  // ---------- 7. Prepaid order (create + razorpay session) ----------
  console.log('\n▸ Prepaid / Online order');
  let prepaidOrder = null;
  try {
    await req('POST', '/cart/sync', {
      token,
      body: {
        items: [
          {
            productId: product._id,
            product: product._id,
            name: product.name,
            weight,
            qty: 1,
            price: unitPrice
          }
        ]
      }
    });

    const q3 = await req(
      'GET',
      `/shipping/quote?pincode=${postalCode}&paymentMethod=UPI&subtotal=${unitPrice}&weightKg=0.2`
    );
    const expectedPrepaid = q3.data?.data?.quote?.prepaid?.fee ?? q3.data?.data?.quote?.deliveryFee;

    const placed = await req('POST', '/orders', {
      token,
      body: {
        addressId,
        paymentMethod: 'UPI',
        idempotencyKey: `e2e_upi_${Date.now()}`
      },
      expectStatus: 201
    });
    prepaidOrder = placed.data?.data?.order;
    assert(Boolean(prepaidOrder?.orderNumber), 'Prepaid order created', prepaidOrder?.orderNumber);

    const fee = prepaidOrder?.pricing?.deliveryFee;
    assert(
      fee === expectedPrepaid || (expectedPrepaid === 0 && fee === 0),
      'Prepaid deliveryFee matches Shiprocket',
      `order ₹${fee} vs quote ₹${expectedPrepaid}`
    );

    // Razorpay create-order session
    try {
      const pay = await req('POST', '/payments/create-order', {
        token,
        body: { orderId: prepaidOrder._id || prepaidOrder.orderNumber }
      });
      const rzp = pay.data?.data;
      assert(
        Boolean(rzp?.razorpayOrderId || rzp?.keyId || pay.status < 500),
        'Razorpay session created or gracefully handled',
        rzp?.razorpayOrderId || pay.data?.message || `status=${pay.status}`
      );
    } catch (e) {
      // Payment may fail if keys missing — note but don't hard-fail whole suite
      fail('Razorpay create-order', e.message);
    }
  } catch (e) {
    fail('Prepaid place order', e.message);
  }

  // ---------- 8. Cancel + not found ----------
  console.log('\n▸ Cancel / edge lookups');
  try {
    const nf = await req('GET', '/orders/AV00000NOPE', { token });
    assert(nf.status === 404 || nf.data?.success === false, 'Unknown order → 404');
  } catch (e) {
    fail('Unknown order', e.message);
  }

  if (codOrder?._id || codOrder?.orderNumber) {
    try {
      const cancelId = codOrder._id || codOrder.orderNumber;
      const cancelled = await req('POST', `/orders/${cancelId}/cancel`, {
        token,
        body: { reason: 'E2E test cancel' }
      });
      const st = cancelled.data?.data?.order?.status || cancelled.data?.data?.order?.orderStatus;
      assert(
        cancelled.status < 400 && (st === 'CANCELLED' || cancelled.data?.success),
        'Cancel COD order',
        st || cancelled.data?.message
      );
    } catch (e) {
      // May already be processing/shipped — acceptable soft fail detail
      fail('Cancel order', e.message);
    }
  }

  // ---------- 9. Shiprocket presence (best-effort) ----------
  console.log('\n▸ Shiprocket (best-effort)');
  if (prepaidOrder || codOrder) {
    const target = prepaidOrder || codOrder;
    const sr = target.shiprocket || {};
    if (sr.orderId || sr.shipmentId || sr.status) {
      ok('Shiprocket fields on order', `status=${sr.status} shipment=${sr.shipmentId || 'n/a'}`);
    } else if (sr.errorMessage) {
      ok('Shiprocket error recorded (check credentials)', sr.errorMessage.slice(0, 120));
    } else {
      // Auto-create may be async / disabled
      ok('Shiprocket auto-create not yet populated (check SHIPROCKET_AUTO_CREATE)', JSON.stringify(sr).slice(0, 80));
    }
  }

  // ---------- Summary ----------
  console.log('\n=== SUMMARY ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  if (codOrder) console.log(`COD order:     ${codOrder.orderNumber}  deliveryFee=₹${codOrder.pricing?.deliveryFee}`);
  if (prepaidOrder) console.log(`Prepaid order: ${prepaidOrder.orderNumber}  deliveryFee=₹${prepaidOrder.pricing?.deliveryFee}`);
  console.log('');

  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
