import axios from 'axios';
import env from '../config/env.js';

/**
 * Low-level Shiprocket HTTP client (https://apidocs.shiprocket.in/)
 * Credentials stay server-side only — never log password or tokens.
 *
 * Canonical flow:
 *  auth/login → orders/create/adhoc → courier/assign/awb
 *  → courier/generate/pickup → courier/generate/label
 *  → courier/generate/invoice → track / webhooks → cancel
 */
class ShiprocketClient {
  constructor() {
    this._token = null;
    this._tokenExpiresAt = 0;
  }

  isConfigured() {
    return Boolean(env.SHIPROCKET.IS_CONFIGURED);
  }

  _assertConfigured() {
    if (!this.isConfigured()) {
      const err = new Error(
        'Shiprocket is not configured. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in backend .env.'
      );
      err.statusCode = 503;
      throw err;
    }
  }

  async authenticate(force = false) {
    this._assertConfigured();

    const now = Date.now();
    if (!force && this._token && now < this._tokenExpiresAt - 60_000) {
      return this._token;
    }

    try {
      const url = `${env.SHIPROCKET.BASE_URL}/auth/login`;
      console.log('[Shiprocket] Authenticating (email only logged):', env.SHIPROCKET.EMAIL);
      const { data } = await axios.post(
        url,
        {
          email: env.SHIPROCKET.EMAIL,
          password: env.SHIPROCKET.PASSWORD
        },
        { timeout: 25_000 }
      );

      if (!data?.token) {
        const err = new Error('Shiprocket authentication failed: no token returned. Check credentials.');
        err.statusCode = 401;
        throw err;
      }

      this._token = data.token;
      this._tokenExpiresAt = now + 9 * 24 * 60 * 60 * 1000;
      console.log('[Shiprocket] Authentication successful.');
      return this._token;
    } catch (error) {
      this._token = null;
      this._tokenExpiresAt = 0;
      if (error.statusCode) throw error;
      const status = error.response?.status;
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Shiprocket authentication failed.';
      console.error('[Shiprocket] Auth error:', msg, status ? `(HTTP ${status})` : '');
      const err = new Error(
        status === 401 || status === 403
          ? 'Invalid Shiprocket credentials. Update SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD.'
          : `Shiprocket authentication error: ${msg}`
      );
      err.statusCode = status === 401 || status === 403 ? 401 : 502;
      err.shiprocket = error.response?.data;
      throw err;
    }
  }

  async request(method, path, { params, data, retry = true } = {}) {
    this._assertConfigured();
    const token = await this.authenticate();
    const url = path.startsWith('http')
      ? path
      : `${env.SHIPROCKET.BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

    try {
      console.log(`[Shiprocket] ${method.toUpperCase()} ${path}`);
      const response = await axios({
        method,
        url,
        params,
        data,
        timeout: 45_000,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const body = error.response?.data;
      const msg = body?.message || body?.error || error.message || 'Shiprocket API request failed';

      if (status === 401 && retry) {
        console.warn('[Shiprocket] Token rejected — re-authenticating once.');
        await this.authenticate(true);
        return this.request(method, path, { params, data, retry: false });
      }

      // Rate limit — one soft retry
      if (status === 429 && retry) {
        console.warn('[Shiprocket] Rate limited — retrying once after 1.5s');
        await new Promise((r) => setTimeout(r, 1500));
        return this.request(method, path, { params, data, retry: false });
      }

      console.error('[Shiprocket] API error:', method.toUpperCase(), path, status || '', msg);
      const err = new Error(typeof msg === 'string' ? msg : 'Shiprocket API request failed');
      err.statusCode = status && status >= 400 && status < 600 ? status : 502;
      err.shiprocket = body;
      throw err;
    }
  }

  // ── Orders ───────────────────────────────────────────────────────────

  createAdhocOrder(payload) {
    return this.request('post', '/orders/create/adhoc', { data: payload });
  }

  getOrderDetails(shiprocketOrderId) {
    return this.request('get', `/orders/show/${shiprocketOrderId}`);
  }

  cancelOrderByIds(ids) {
    const list = Array.isArray(ids) ? ids : [ids];
    return this.request('post', '/orders/cancel', {
      data: { ids: list.map((id) => Number(id)) }
    });
  }

  // ── Couriers / AWB / Pickup / Docs ───────────────────────────────────

  checkServiceability({ pickupPostcode, deliveryPostcode, weight, cod = 0 }) {
    return this.request('get', '/courier/serviceability', {
      params: {
        pickup_postcode: pickupPostcode,
        delivery_postcode: deliveryPostcode,
        weight,
        cod
      }
    });
  }

  assignAwb({ shipmentId, courierId, isReturn = false }) {
    const data = { shipment_id: Number(shipmentId) };
    if (courierId !== undefined && courierId !== null && courierId !== '') {
      data.courier_id = Number(courierId);
    }
    if (isReturn) data.is_return = 1;
    return this.request('post', '/courier/assign/awb', { data });
  }

  generatePickup(shipmentIds) {
    const ids = Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds];
    return this.request('post', '/courier/generate/pickup', {
      data: { shipment_id: ids.map((id) => Number(id)) }
    });
  }

  generateLabel(shipmentIds) {
    const ids = Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds];
    return this.request('post', '/courier/generate/label', {
      data: { shipment_id: ids.map((id) => Number(id)) }
    });
  }

  generateInvoice(shipmentIds) {
    const ids = Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds];
    return this.request('post', '/orders/print/invoice', {
      data: { ids: ids.map((id) => Number(id)) }
    });
  }

  generateManifest(shipmentIds) {
    const ids = Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds];
    return this.request('post', '/manifests/generate', {
      data: { shipment_id: ids.map((id) => Number(id)) }
    });
  }

  // ── Tracking ─────────────────────────────────────────────────────────

  trackByAwb(awbCode) {
    return this.request('get', `/courier/track/awb/${encodeURIComponent(awbCode)}`);
  }

  trackByShipmentId(shipmentId) {
    return this.request('get', `/courier/track/shipment/${encodeURIComponent(shipmentId)}`);
  }

  trackByOrderIds(orderIds) {
    const ids = Array.isArray(orderIds) ? orderIds : [orderIds];
    return this.request('get', '/courier/track', {
      params: { order_id: ids.map(String).join(',') }
    });
  }

  cancelShipment(ids) {
    const list = Array.isArray(ids) ? ids : [ids];
    return this.request('post', '/orders/cancel/shipment/awbs', {
      data: { awbs: list }
    });
  }

  // ── Account helpers ──────────────────────────────────────────────────

  listPickupLocations() {
    return this.request('get', '/settings/company/pickup');
  }
}

export const shiprocketClient = new ShiprocketClient();
export default shiprocketClient;
