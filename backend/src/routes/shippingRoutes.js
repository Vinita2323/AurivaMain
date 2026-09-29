import { Router } from 'express';
import { getQuote } from '../controllers/shippingController.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const quoteLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many shipping quote requests. Please wait a moment.'
});

// GET /api/v1/shipping/quote?pincode=452003&paymentMethod=COD&subtotal=301&weightKg=0.2
router.get('/quote', quoteLimiter, getQuote);

export default router;
