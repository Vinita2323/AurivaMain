import { Router } from 'express';
import multer from 'multer';
import uploadController from '../controllers/uploadController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

// Configure in-memory storage for Multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP, GIF, SVG) are allowed.'), false);
    }
  }
});

// Admin Authentication & Role requirement
router.use(authMiddleware, requireAdmin);

/**
 * @route   POST /api/v1/admin/upload
 * @desc    Upload product/category image to Cloudinary (Multipart or Base64 JSON)
 * @access  Admin Protected
 */
router.post('/', upload.single('image'), uploadController.uploadImage);

/**
 * @route   DELETE /api/v1/admin/upload/:publicId
 * @desc    Remove image from Cloudinary
 * @access  Admin Protected
 */
router.delete('/:publicId', uploadController.deleteImage);

export default router;
