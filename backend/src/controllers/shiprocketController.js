import shiprocketFulfillmentService from '../services/shiprocketFulfillmentService.js';
import shiprocketClient from '../services/shiprocketClient.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';
import env from '../config/env.js';

class ShiprocketController {
  async getConfigStatus(req, res, next) {
    try {
      let pickupNames = [];
      if (shiprocketClient.isConfigured()) {
        try {
          const pickups = await shiprocketClient.listPickupLocations();
          const list =
            pickups?.data?.shipping_address ||
            pickups?.shipping_address ||
            pickups?.data ||
            [];
          pickupNames = Array.isArray(list)
            ? list.map((p) => p.pickup_location || p.name).filter(Boolean)
            : [];
        } catch (e) {
          console.warn('[Shiprocket] Pickup list note:', e.message);
        }
      }

      return sendSuccess(res, 'Shiprocket configuration status', {
        configured: shiprocketClient.isConfigured(),
        autoCreate: env.SHIPROCKET.AUTO_CREATE,
        autoFulfill: env.SHIPROCKET.AUTO_FULFILL || 'create',
        pickupLocation: env.SHIPROCKET.PICKUP_LOCATION,
        pickupLocationMatch: pickupNames.includes(env.SHIPROCKET.PICKUP_LOCATION),
        registeredPickups: pickupNames,
        baseUrl: env.SHIPROCKET.BASE_URL,
        webhookConfigured: Boolean(env.SHIPROCKET.WEBHOOK_TOKEN)
      });
    } catch (error) {
      next(error);
    }
  }

  async createShipment(req, res, next) {
    try {
      const result = await shiprocketFulfillmentService.createShipmentForOrder(req.params.id, {
        force: Boolean(req.body?.force),
        pickupLocation: req.body?.pickupLocation,
        customerEmail: req.body?.customerEmail,
        skipServiceabilityCheck: Boolean(req.body?.skipServiceabilityCheck)
      });
      return sendSuccess(res, result.message || 'Shipment created', {
        order: result.order,
        shiprocket: result.shiprocket,
        alreadyExists: result.alreadyExists
      });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.shiprocket || {}, error.statusCode);
      }
      next(error);
    }
  }

  async fulfill(req, res, next) {
    try {
      const result = await shiprocketFulfillmentService.fulfillOrder(req.params.id, {
        courierId: req.body?.courierId,
        pickupLocation: req.body?.pickupLocation
      });
      return sendSuccess(res, 'Shiprocket fulfillment pipeline executed', result);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.shiprocket || {}, error.statusCode);
      }
      next(error);
    }
  }

  async serviceability(req, res, next) {
    try {
      const result = await shiprocketFulfillmentService.checkServiceabilityForOrder(req.params.id, {
        weight: req.query.weight ? Number(req.query.weight) : undefined
      });
      return sendSuccess(res, 'Serviceability checked', result);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.shiprocket || {}, error.statusCode);
      }
      next(error);
    }
  }

  async assignAwb(req, res, next) {
    try {
      const result = await shiprocketFulfillmentService.assignCourierAndGenerateAwb(req.params.id, {
        courierId: req.body?.courierId
      });
      return sendSuccess(res, result.message || 'AWB generated', {
        order: result.order,
        shiprocket: result.shiprocket,
        alreadyExists: result.alreadyExists
      });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.shiprocket || {}, error.statusCode);
      }
      next(error);
    }
  }

  async schedulePickup(req, res, next) {
    try {
      const result = await shiprocketFulfillmentService.schedulePickup(req.params.id);
      return sendSuccess(res, result.message || 'Pickup scheduled', {
        order: result.order,
        shiprocket: result.shiprocket,
        alreadyExists: result.alreadyExists
      });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.shiprocket || {}, error.statusCode);
      }
      next(error);
    }
  }

  async generateLabel(req, res, next) {
    try {
      const result = await shiprocketFulfillmentService.generateLabel(req.params.id);
      return sendSuccess(res, result.message || 'Label generated', {
        order: result.order,
        shiprocket: result.shiprocket,
        labelUrl: result.labelUrl
      });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.shiprocket || {}, error.statusCode);
      }
      next(error);
    }
  }

  async generateInvoice(req, res, next) {
    try {
      const result = await shiprocketFulfillmentService.generateInvoice(req.params.id);
      return sendSuccess(res, result.message || 'Invoice generated', {
        order: result.order,
        shiprocket: result.shiprocket,
        invoiceUrl: result.invoiceUrl
      });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.shiprocket || {}, error.statusCode);
      }
      next(error);
    }
  }

  async generateManifest(req, res, next) {
    try {
      const result = await shiprocketFulfillmentService.generateManifest(req.params.id);
      return sendSuccess(res, result.message || 'Manifest generated', {
        order: result.order,
        shiprocket: result.shiprocket,
        manifestUrl: result.manifestUrl
      });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.shiprocket || {}, error.statusCode);
      }
      next(error);
    }
  }

  async track(req, res, next) {
    try {
      const result = await shiprocketFulfillmentService.trackShipment(req.params.id);
      return sendSuccess(res, 'Tracking synced', result);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.shiprocket || {}, error.statusCode);
      }
      next(error);
    }
  }

  async cancelShipment(req, res, next) {
    try {
      const result = await shiprocketFulfillmentService.cancelShipment(req.params.id, {
        cancelAurivaOrder: Boolean(req.body?.cancelOrder)
      });
      return sendSuccess(res, result.message || 'Shipment cancel requested', {
        order: result.order,
        shiprocket: result.shiprocket,
        alreadyExists: result.alreadyExists
      });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.shiprocket || {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Public webhook — secured via SHIPROCKET_WEBHOOK_TOKEN (x-api-key header).
   * Always acknowledge quickly; Shiprocket expects HTTP 200.
   */
  async webhook(req, res, next) {
    try {
      const expected = env.SHIPROCKET.WEBHOOK_TOKEN;
      if (expected) {
        const provided =
          req.get('x-api-key') ||
          req.get('x-shiprocket-token') ||
          req.query.token ||
          req.body?.token ||
          '';
        if (String(provided) !== String(expected)) {
          console.warn('[Shipping Webhook] Rejected: invalid or missing auth token');
          return sendError(res, 'Invalid webhook token.', {}, HTTP_STATUS.UNAUTHORIZED);
        }
      } else {
        console.warn(
          '[Shipping Webhook] SHIPROCKET_WEBHOOK_TOKEN is empty — accepting without auth (set token in production).'
        );
      }

      const payload = req.body || {};
      console.log('[Shipping Webhook] Received status update', {
        awb: payload.awb || payload.awb_code || null,
        status: payload.current_status || payload.shipment_status || payload.status || null,
        order_id: payload.order_id || payload.channel_order_id || null,
        sr_order_id: payload.sr_order_id || null,
        shipment_id: payload.shipment_id || null
      });

      const result = await shiprocketFulfillmentService.handleWebhook(payload, {
        webhookId: req.get('x-shiprocket-event-id') || null
      });

      return sendSuccess(res, 'Webhook processed', result);
    } catch (error) {
      console.error('[Shipping Webhook] Error:', error.message);
      // Still return 200 when possible so Shiprocket does not disable the webhook —
      // but validation/auth errors above already returned. Soft-fail unknown errors as 200 with flag.
      if (error.statusCode && error.statusCode < 500) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      return sendSuccess(res, 'Webhook accepted with processing error', {
        matched: false,
        error: error.message
      });
    }
  }
}

export const shiprocketController = new ShiprocketController();
export default shiprocketController;
