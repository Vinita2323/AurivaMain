import mongoose from 'mongoose';
import Order from '../models/Order.js';
import invoiceService from '../services/invoiceService.js';
import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

class InvoiceController {
  /**
   * Customer: Download official Invoice PDF for an order
   * GET /api/v1/orders/:id/invoice
   * @access Protected (Customer - Own Orders Only)
   */
  async getOrderInvoice(req, res, next) {
    try {
      const { id } = req.params;

      const query = mongoose.Types.ObjectId.isValid(id)
        ? { _id: id }
        : { orderNumber: id };

      const order = await Order.findOne(query);
      if (!order) {
        return sendError(res, 'Order not found.', {}, HTTP_STATUS.NOT_FOUND);
      }

      // Strict Customer Ownership Verification
      if (order.user.toString() !== req.user._id.toString()) {
        return sendError(
          res,
          'Unauthorized: You do not have permission to download this invoice.',
          {},
          HTTP_STATUS.FORBIDDEN
        );
      }

      const filename = `Invoice-${order.orderNumber}.pdf`;
      const isDownload = req.query.download === '1' || req.query.download === 'true';
      const disposition = isDownload ? 'attachment' : 'inline';

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);

      const pdfDoc = await invoiceService.generateInvoicePdf(order);
      pdfDoc.pipe(res);
    } catch (error) {
      console.error('[Invoice Controller Error]', error);
      if (!res.headersSent) {
        return sendError(res, error.message || 'Failed to generate invoice.', {}, HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }
      next(error);
    }
  }

  /**
   * Admin: Download official Invoice PDF for any order
   * GET /api/v1/admin/orders/:id/invoice
   * @access Protected (Admin Only)
   */
  async getAdminOrderInvoice(req, res, next) {
    try {
      const { id } = req.params;

      const query = mongoose.Types.ObjectId.isValid(id)
        ? { _id: id }
        : { orderNumber: id };

      const order = await Order.findOne(query);
      if (!order) {
        return sendError(res, 'Order not found.', {}, HTTP_STATUS.NOT_FOUND);
      }

      const filename = `Invoice-${order.orderNumber}.pdf`;
      const isDownload = req.query.download === '1' || req.query.download === 'true';
      const disposition = isDownload ? 'attachment' : 'inline';

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);

      const pdfDoc = await invoiceService.generateInvoicePdf(order);
      pdfDoc.pipe(res);
    } catch (error) {
      console.error('[Admin Invoice Controller Error]', error);
      if (!res.headersSent) {
        return sendError(res, error.message || 'Failed to generate invoice.', {}, HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }
      next(error);
    }
  }
}

export const invoiceController = new InvoiceController();
export default invoiceController;
