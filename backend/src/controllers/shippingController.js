import { getDeliveryQuote } from '../services/deliveryQuoteService.js';
import { sendSuccess } from '../utils/response.js';

export const getQuote = async (req, res, next) => {
  try {
    const { pincode, paymentMethod, subtotal, weightKg } = req.query;
    const quote = await getDeliveryQuote({
      pincode,
      paymentMethod,
      subtotal,
      weightKg
    });
    return sendSuccess(res, 'Shipping quote retrieved', { quote });
  } catch (error) {
    next(error);
  }
};

export default { getQuote };
