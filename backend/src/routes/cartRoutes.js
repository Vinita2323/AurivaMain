import { Router } from 'express';
import cartController from '../controllers/cartController.js';
import { verifyToken } from '../utils/generateToken.js';
import User from '../models/User.js';

const router = Router();

/**
 * Optional Authentication Middleware
 * Decodes user if token present, but does not block guests
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = verifyToken(token);
        if (decoded && decoded.id) {
          const user = await User.findById(decoded.id);
          if (user) {
            req.user = user;
          }
        }
      } catch (tokenErr) {
        // Token expired or invalid - ignore and proceed as guest session
      }
    }
  } catch (err) {
    // Proceed
  }
  next();
};

router.use(optionalAuth);

// Cart endpoints
router.get('/', (req, res, next) => cartController.getCart(req, res, next));
router.post('/items', (req, res, next) => cartController.addItem(req, res, next));
router.put('/items', (req, res, next) => cartController.updateQty(req, res, next));
router.delete('/items', (req, res, next) => cartController.removeItem(req, res, next));
router.delete('/', (req, res, next) => cartController.clearCart(req, res, next));
router.post('/sync', (req, res, next) => cartController.syncCart(req, res, next));
router.post('/apply-coupon', (req, res, next) => cartController.applyCoupon(req, res, next));
router.post('/coupon', (req, res, next) => cartController.applyCoupon(req, res, next));
router.delete('/remove-coupon', (req, res, next) => cartController.removeCoupon(req, res, next));
router.post('/remove-coupon', (req, res, next) => cartController.removeCoupon(req, res, next));

export default router;
