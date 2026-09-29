import shiprocketFulfillmentService from '../services/shiprocketFulfillmentService.js';
import shiprocketClient from '../services/shiprocketClient.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';
import env from '../config/env.js';

class ShiprocketController {
  async getConfigStatus(req, res, next) {
    try {
      return sendSuccess(res, 'Shiprocket configuration status', {
        configured: shiprocketClient.isConfigured(),
        autoCreate: env.SHIPROCKET.AUTO_CREATE,
        pickupLocation: env.SHIPROCKET.PICKUP_LOCATION,
        baseUrl: env.SHIPROCKET.BASE_URL
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
        customerEmail: req.body?.customerEmail
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
        shiprocket: result.shiprocket
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

  async track(req, res, next) {
    try {
      const result = await shiprocketFulfillmentService.trackShipment(req.params.id);
      return sendSuccess(res, 'Tracking fetched', result);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, error.shiprocket || {}, error.statusCode);
      }
      next(error);
    }
  }

  async cancelShipment(req, res, next) {
    try {
      const result = await shiprocketFulfillmentService.cancelShipment(req.params.id);
      return sendSuccess(res, result.message || 'Shipment cancel requested', {
        order: result.order,
        shiprocket: result.shiprocket
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
   * Always acknowledge quickly; Shiprocket expects open POST access.
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
        console.warn('[Shipping Webhook] SHIPROCKET_WEBHOOK_TOKEN is empty — accepting without auth (set token in production).');
      }

      const payload = req.body || {};
      console.log('[Shipping Webhook] Received status update', {
        awb: payload.awb || payload.awb_code || null,
        status: payload.current_status || payload.shipment_status || payload.status || null,
        order_id: payload.order_id || payload.channel_order_id || null
      });

      const result = await shiprocketFulfillmentService.handleWebhook(payload, {
        webhookId: req.get('x-shiprocket-event-id') || payload.sr_order_id || payload.id
      });

      return sendSuccess(res, 'Webhook processed', result);
    } catch (error) {
      console.error('[Shipping Webhook] Error:', error.message);
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }
}

export const shiprocketController = new ShiprocketController();
export default shiprocketController;
