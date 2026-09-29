import { cloudinary, isConfigured } from '../config/cloudinary.js';
import env from '../config/env.js';

const UPLOAD_TIMEOUT_MS = 35_000;

function withTimeout(promise, ms = UPLOAD_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        const err = new Error('Image upload timed out. Please try a smaller photo or check your Cloudinary connection.');
        err.statusCode = 504;
        reject(err);
      }, ms);
    })
  ]);
}

class UploadService {
  /**
   * Upload an image to Cloudinary (Base64 string, URL, or File Buffer)
   * @param {string|Buffer} fileSource - Base64 Data URI, remote URL, or buffer
   * @param {object} [options] - Custom upload options (folder, tags, transformation)
   * @returns {Promise<{ url: string, publicId: string, format: string, width?: number, height?: number }>}
   */
  async uploadImage(fileSource, options = {}) {
    if (!fileSource) {
      const err = new Error('No image file or data provided for upload.');
      err.statusCode = 400;
      throw err;
    }

    const folder = options.folder || env.CLOUDINARY.FOLDER || 'auriva_products';

    // If real Cloudinary keys are configured in .env, execute live Cloudinary upload
    // NOTE: No eager transformations here — they slow uploads a lot.
    // Delivery-time transforms (f_auto,q_auto) can be applied via URL when rendering.
    if (isConfigured) {
      try {
        const uploadOptions = {
          folder,
          resource_type: 'image',
          overwrite: false,
          unique_filename: true,
          use_filename: true,
          ...(options.transformation ? { transformation: options.transformation } : {})
        };

        if (typeof fileSource === 'string') {
          // Base64 Data URI or Image URL
          const result = await withTimeout(cloudinary.uploader.upload(fileSource, uploadOptions));

          return {
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes
          };
        } else if (Buffer.isBuffer(fileSource)) {
          // File Buffer upload using upload_stream (fastest path for multipart)
          const streamUpload = new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              uploadOptions,
              (error, result) => {
                if (error) return reject(error);
                resolve({
                  url: result.secure_url,
                  publicId: result.public_id,
                  format: result.format,
                  width: result.width,
                  height: result.height,
                  bytes: result.bytes
                });
              }
            );
            uploadStream.end(fileSource);
          });
          return await withTimeout(streamUpload);
        }
      } catch (cloudErr) {
        console.error('[Cloudinary Upload Error]', cloudErr.message);
        if (!cloudErr.statusCode) {
          cloudErr.statusCode = cloudErr.http_code || 502;
        }
        throw cloudErr;
      }
    }

    // Fallback / Placeholder mode (while user prepares real Cloudinary credentials)
    console.log('[Cloudinary Sandbox] Dummy credentials detected. Returning image payload directly.');
    
    // If it's already a base64 string or URL, return it safely
    if (typeof fileSource === 'string') {
      return {
        url: fileSource,
        publicId: `dummy_${Date.now()}`,
        format: 'png',
        isDummy: true
      };
    }

    // If it's a buffer, convert to base64 data URI
    const mime = options.mimetype || 'image/jpeg';
    const base64Data = `data:${mime};base64,${fileSource.toString('base64')}`;
    return {
      url: base64Data,
      publicId: `dummy_${Date.now()}`,
      format: 'png',
      isDummy: true
    };
  }

  /**
   * Delete an image from Cloudinary by public ID
   * @param {string} publicId
   */
  async deleteImage(publicId) {
    if (!publicId || publicId.startsWith('dummy_')) {
      return { result: 'ok', skipped: true };
    }

    if (isConfigured) {
      try {
        return await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.warn('[Cloudinary Delete Warning]', err.message);
        return { result: 'error', message: err.message };
      }
    }

    return { result: 'ok', placeholder: true };
  }
}

export const uploadService = new UploadService();
export default uploadService;
