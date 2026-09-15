import { Router } from 'express';
import wishlistController from '../controllers/wishlistController.js';
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

// Wishlist endpoints
router.get('/', (req, res, next) => wishlistController.getWishlist(req, res, next));
router.post('/toggle', (req, res, next) => wishlistController.toggleWishlist(req, res, next));
router.delete('/items', (req, res, next) => wishlistController.removeItem(req, res, next));
router.delete('/', (req, res, next) => wishlistController.clearWishlist(req, res, next));
router.post('/sync', (req, res, next) => wishlistController.syncWishlist(req, res, next));

export default router;
