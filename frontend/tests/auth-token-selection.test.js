// Regression tests for QA-004 (wrong admin password must not log the admin out)
// and QA-005 (token chosen by API endpoint, not by page).
// Run: npm run test:auth   (plain node:test, no extra packages, no network, no real credentials)
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
// API_SRC lets you point the suite at another copy of api.js (e.g. `git show HEAD:...`) to prove it fails on old code.
const source = fs.readFileSync(process.env.API_SRC || path.join(here, '../src/utils/api.js'), 'utf8');

// api.js reads Vite's import.meta.env; give it a stub and load a copy from the OS temp dir.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'auriva-api-test-'));
const tmpFile = path.join(tmp, 'api.mjs');
fs.writeFileSync(tmpFile, source.split('import.meta.env').join('({ DEV: true, VITE_API_URL: "" })'));

// ---- browser stubs ----
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k)
};
let assigned = [];
globalThis.window = {
  location: { pathname: '/', hostname: 'localhost', origin: 'http://localhost', assign: (u) => assigned.push(u) },
  dispatchEvent: () => {}
};
globalThis.CustomEvent = class { constructor(t) { this.type = t; } };

const jwt = (payload) => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'none' })}.${b64(payload)}.sig`;
};
const inHour = Math.floor(Date.now() / 1000) + 3600;
const ADMIN = jwt({ id: 'a1', role: 'ADMIN', exp: inHour });
const USER = jwt({ id: 'u1', role: 'USER', exp: inHour });
const EXPIRED_ADMIN = jwt({ id: 'a1', role: 'ADMIN', exp: Math.floor(Date.now() / 1000) - 60 });

let calls = [];
let nextResponse = { status: 200, body: { success: true, data: {} } };
globalThis.fetch = async (url, opts) => {
  calls.push({ url, auth: opts.headers.Authorization || null });
  return { ok: nextResponse.status < 400, status: nextResponse.status, json: async () => nextResponse.body };
};

const { apiRequest, adminAuthApi } = await import(pathToFileURL(tmpFile).href);

const setPage = (p) => { window.location.pathname = p; };
const lastAuth = () => calls[calls.length - 1].auth;
beforeEach(() => {
  store.clear(); calls = []; assigned = [];
  nextResponse = { status: 200, body: { success: true, data: {} } };
  setPage('/');
});

// ---------------- QA-005 ----------------
test('QA-005: customer endpoints carry the USER token on admin pages', async () => {
  store.set('auriva_admin_token', ADMIN); store.set('auriva_user_token', USER);
  setPage('/admin/products');
  for (const ep of ['/user/addresses', '/orders', '/cart', '/wishlist', '/wallet?page=1']) {
    await apiRequest(ep);
    assert.equal(lastAuth(), `Bearer ${USER}`, ep);
  }
});

test('QA-005: customer endpoints never get the admin token (no user session -> no auth header)', async () => {
  store.set('auriva_admin_token', ADMIN);
  setPage('/admin/orders');
  await apiRequest('/orders');
  assert.equal(lastAuth(), null);
});

test('QA-005: admin endpoints carry the ADMIN token on every page', async () => {
  store.set('auriva_admin_token', ADMIN); store.set('auriva_user_token', USER);
  for (const page of ['/admin/products', '/shop', '/']) {
    setPage(page);
    for (const ep of ['/admin/orders', '/admin/products', '/auth/admin/profile', '/admin/payments?view=all']) {
      await apiRequest(ep);
      assert.equal(lastAuth(), `Bearer ${ADMIN}`, `${page} ${ep}`);
    }
  }
});

test('QA-005: admin endpoints never fall back to the customer token', async () => {
  store.set('auriva_user_token', USER);
  setPage('/admin/orders');
  await apiRequest('/admin/orders');
  assert.equal(lastAuth(), null);
});

test('QA-005: shared /fcm-tokens uses admin token on admin pages and user token on the storefront', async () => {
  store.set('auriva_admin_token', ADMIN); store.set('auriva_user_token', USER);
  setPage('/admin/dashboard');
  await apiRequest('/fcm-tokens/save', { method: 'POST' });
  assert.equal(lastAuth(), `Bearer ${ADMIN}`);
  setPage('/account');
  await apiRequest('/fcm-tokens/save', { method: 'POST' });
  assert.equal(lastAuth(), `Bearer ${USER}`);
});

test('storefront authentication unchanged: user token on customer endpoints, admin token never sent', async () => {
  store.set('auriva_admin_token', ADMIN); store.set('auriva_user_token', USER);
  setPage('/checkout');
  for (const ep of ['/cart', '/orders', '/auth/user/profile', '/payments/create-order', '/wishlist']) {
    await apiRequest(ep);
    assert.equal(lastAuth(), `Bearer ${USER}`, ep);
  }
  store.delete('auriva_user_token');
  await apiRequest('/cart');
  assert.equal(lastAuth(), null);
});

test('storefront: an expired customer token is dropped before the request', async () => {
  store.set('auriva_user_token', jwt({ id: 'u1', role: 'USER', exp: 1 }));
  await apiRequest('/cart');
  assert.equal(lastAuth(), null);
  assert.equal(store.has('auriva_user_token'), false);
});

test('storefront: a 401 on a customer call clears the customer session only', async () => {
  store.set('auriva_admin_token', ADMIN); store.set('auriva_user_token', USER);
  setPage('/cart');
  nextResponse = { status: 401, body: { message: 'Invalid token' } };
  await assert.rejects(apiRequest('/cart'));
  assert.equal(store.has('auriva_user_token'), false);
  assert.equal(store.get('auriva_admin_token'), ADMIN);
  assert.deepEqual(assigned, []);
});

test('QA-005: a 401 on a CUSTOMER call made from an admin page does not log the admin out', async () => {
  store.set('auriva_admin_token', ADMIN); store.set('auriva_user_token', USER);
  setPage('/admin/products');
  nextResponse = { status: 401, body: { message: 'Invalid token' } };
  await assert.rejects(apiRequest('/user/addresses'));
  assert.equal(store.get('auriva_admin_token'), ADMIN);
  assert.deepEqual(assigned, []);
});

// ---------------- QA-004 ----------------
test('QA-004: wrong current password -> error is thrown, admin stays signed in, no redirect', async () => {
  store.set('auriva_admin_token', ADMIN); store.set('auriva_admin_auth', 'true');
  setPage('/admin/profile');
  nextResponse = { status: 401, body: { success: false, message: 'Current password is incorrect.' } };
  await assert.rejects(
    adminAuthApi.changePassword({ currentPassword: 'wrong', newPassword: 'newpass1' }),
    /Current password is incorrect/
  );
  assert.equal(store.get('auriva_admin_token'), ADMIN);
  assert.equal(store.get('auriva_admin_auth'), 'true');
  assert.deepEqual(assigned, []);
});

test('QA-004: correct current password -> request succeeds and session is kept', async () => {
  store.set('auriva_admin_token', ADMIN);
  setPage('/admin/profile');
  nextResponse = { status: 200, body: { success: true, message: 'Password updated.' } };
  const res = await adminAuthApi.changePassword({ currentPassword: 'old', newPassword: 'newpass1' });
  assert.equal(res.success, true);
  assert.equal(lastAuth(), `Bearer ${ADMIN}`);
  assert.equal(store.get('auriva_admin_token'), ADMIN);
  assert.deepEqual(assigned, []);
});

test('QA-004: genuinely expired admin token on change-password -> session cleared and redirect to login', async () => {
  store.set('auriva_admin_token', EXPIRED_ADMIN);
  setPage('/admin/profile');
  nextResponse = { status: 401, body: { message: 'Token expired' } };
  await assert.rejects(adminAuthApi.changePassword({ currentPassword: 'x', newPassword: 'newpass1' }));
  assert.equal(store.has('auriva_admin_token'), false);
  assert.deepEqual(assigned, ['/admin/login']);
});

test('QA-004: any other admin 401 (expired/invalid session) still logs out and redirects', async () => {
  store.set('auriva_admin_token', ADMIN);
  setPage('/admin/orders');
  nextResponse = { status: 401, body: { message: 'Invalid or expired token' } };
  await assert.rejects(apiRequest('/admin/orders'));
  assert.equal(store.has('auriva_admin_token'), false);
  assert.deepEqual(assigned, ['/admin/login']);
});

test('QA-004: a 401 from admin login itself never redirects', async () => {
  setPage('/admin/login');
  nextResponse = { status: 401, body: { message: 'Invalid credentials' } };
  await assert.rejects(apiRequest('/auth/admin/login', { method: 'POST', body: '{}' }));
  assert.deepEqual(assigned, []);
});
