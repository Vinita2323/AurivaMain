import * as orderService from '../services/orderService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

export const placeOrder = async (req, res, next) => {
  try {
    const order = await orderService.placeOrder(req.user._id, req.body);
    return sendSuccess(
      res,
      'Order placed successfully',
      { order },
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, null, error.statusCode);
    }
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const isAdmin = req.user && req.user.role === 'ADMIN';
    const order = await orderService.getOrderById(req.user._id, req.params.id, isAdmin);
    return sendSuccess(res, 'Order retrieved successfully', { order });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, null, error.statusCode);
    }
    next(error);
  }
};

export const getUserOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getUserOrders(req.user._id);
    return sendSuccess(res, 'User orders retrieved successfully', { orders });
  } catch (error) {
    next(error);
  }
};

export const getCheckoutSummary = async (req, res, next) => {
  try {
    const summary = await orderService.getCheckoutSummary(req.user._id);
    return sendSuccess(res, 'Checkout summary calculated successfully', summary);
  } catch (error) {
    next(error);
  }
};

export const getAllOrdersAdmin = async (req, res, next) => {
  try {
    const result = await orderService.getAllOrdersAdmin(req.query);
    return sendSuccess(res, 'Admin orders retrieved successfully', result, HTTP_STATUS.OK);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, null, error.statusCode);
    }
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const updatedBy = req.user?.name ? `${req.user.name} (Admin)` : 'Admin';
    const order = await orderService.updateOrderStatusAdmin(id, status, { updatedBy, note });
    return sendSuccess(res, `Order status updated to ${order.status}`, { order }, HTTP_STATUS.OK);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, null, error.statusCode);
    }
    next(error);
  }
};

export const dispatchOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await orderService.dispatchOrderAdmin(id, req.body);
    return sendSuccess(res, 'Order dispatch information updated successfully', { order }, HTTP_STATUS.OK);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, null, error.statusCode);
    }
    next(error);
  }
};

export const cancelOrderAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reason = req.body.reason || req.body.cancelReason || 'Cancelled by administrator';
    const order = await orderService.cancelOrder(id, {
      cancelledBy: 'ADMIN',
      cancelReason: reason,
      isAdmin: true
    });
    return sendSuccess(res, 'Order cancelled and inventory restored successfully', { order }, HTTP_STATUS.OK);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, null, error.statusCode);
    }
    next(error);
  }
};

export const cancelOrderCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reason = req.body.reason || req.body.cancelReason || 'Customer requested cancellation';
    const order = await orderService.cancelOrder(id, {
      cancelledBy: 'CUSTOMER',
      cancelReason: reason,
      userId: req.user._id,
      isAdmin: false
    });
    return sendSuccess(res, 'Order cancelled successfully', { order }, HTTP_STATUS.OK);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, null, error.statusCode);
    }
    next(error);
  }
};

export default {
  placeOrder,
  getOrderById,
  getUserOrders,
  getCheckoutSummary,
  getAllOrdersAdmin,
  updateOrderStatus,
  dispatchOrder,
  cancelOrderAdmin,
  cancelOrderCustomer
};

