import uploadService from '../services/uploadService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

class UploadController {
  /**
   * Upload single image (supports Base64 in JSON or Multipart Form File)
   * POST /api/v1/admin/upload or POST /api/v1/upload
   */
  async uploadImage(req, res, next) {
    try {
      let fileSource = null;
      const options = {
        folder: req.body.folder || 'auriva_products'
      };

      // 1. Multipart file upload via multer
      if (req.file) {
        fileSource = req.file.buffer;
        options.mimetype = req.file.mimetype;
      } 
      // 2. Base64 Data URI in JSON body: { image: 'data:image/...' }
      else if (req.body && req.body.image) {
        fileSource = req.body.image;
      }

      if (!fileSource) {
        return sendError(res, 'Please provide an image file or base64 data.', {}, HTTP_STATUS.BAD_REQUEST);
      }

      const result = await uploadService.uploadImage(fileSource, options);

      return sendSuccess(
        res,
        'Image uploaded successfully to Cloudinary.',
        {
          url: result.url,
          publicId: result.publicId,
          format: result.format,
          isDummy: Boolean(result.isDummy)
        },
        HTTP_STATUS.OK
      );
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Delete image from Cloudinary
   * DELETE /api/v1/admin/upload/:publicId
   */
  async deleteImage(req, res, next) {
    try {
      const { publicId } = req.params;
      const result = await uploadService.deleteImage(publicId);
      return sendSuccess(res, 'Image deletion processed.', result, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }
}

export const uploadController = new UploadController();
export default uploadController;
