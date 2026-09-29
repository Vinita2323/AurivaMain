import axios from 'axios';
import env from '../config/env.js';

/**
 * Low-level Shiprocket HTTP client with in-memory token cache.
 * Credentials stay server-side only — never log password or tokens.
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

  /**
   * Authenticate and cache token (Shiprocket tokens typically last ~10 days).
   */
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
      // Refresh after 9 days by default
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

  /**
   * Authenticated request helper with one-time re-auth on 401.
   */
  async request(method, path, { params, data, retry = true } = {}) {
    this._assertConfigured();
    const token = await this.authenticate();
    const url = path.startsWith('http') ? path : `${env.SHIPROCKET.BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

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

      console.error('[Shiprocket] API error:', method.toUpperCase(), path, status || '', msg);
      const err = new Error(typeof msg === 'string' ? msg : 'Shiprocket API request failed');
      err.statusCode = status && status >= 400 && status < 600 ? status : 502;
      err.shiprocket = body;
      throw err;
    }
  }

  // ── Public API wrappers ──────────────────────────────────────────────

  createAdhocOrder(payload) {
    return this.request('post', '/orders/create/adhoc', { data: payload });
  }

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

  assignAwb({ shipmentId, courierId }) {
    const data = { shipment_id: Number(shipmentId) };
    if (courierId !== undefined && courierId !== null && courierId !== '') {
      data.courier_id = Number(courierId);
    }
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

  trackByAwb(awbCode) {
    return this.request('get', `/courier/track/awb/${encodeURIComponent(awbCode)}`);
  }

  cancelShipment(ids) {
    const list = Array.isArray(ids) ? ids : [ids];
    return this.request('post', '/orders/cancel/shipment/awbs', {
      data: { awbs: list }
    });
  }

  cancelOrderByIds(ids) {
    const list = Array.isArray(ids) ? ids : [ids];
    return this.request('post', '/orders/cancel', {
      data: { ids: list.map((id) => Number(id)) }
    });
  }

  getOrderDetails(shiprocketOrderId) {
    return this.request('get', `/orders/show/${shiprocketOrderId}`);
  }
}

export const shiprocketClient = new ShiprocketClient();
export default shiprocketClient;
