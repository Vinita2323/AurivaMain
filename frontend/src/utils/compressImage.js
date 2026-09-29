/**
 * Client-side image compression before Cloudinary upload.
 * Shrinks large phone photos so uploads finish in seconds instead of minutes.
 */

const DEFAULTS = {
  maxWidth: 1400,
  maxHeight: 1400,
  quality: 0.82,
  /** Skip compression when file is already small enough */
  skipBelowBytes: 350 * 1024
};

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image for compression.'));
    };
    img.src = url;
  });
}

/**
 * @param {File|Blob} file
 * @param {object} [opts]
 * @returns {Promise<File>}
 */
export async function compressImageFile(file, opts = {}) {
  const { maxWidth, maxHeight, quality, skipBelowBytes } = { ...DEFAULTS, ...opts };

  if (!(file instanceof Blob)) return file;
  if (!file.type?.startsWith('image/')) return file;
  // GIFs / SVG — leave alone (animation / vectors)
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
  if (file.size > 0 && file.size <= skipBelowBytes) return file;

  try {
    const img = await loadImageElement(file);
    let { width, height } = img;

    if (width <= maxWidth && height <= maxHeight && file.size <= skipBelowBytes * 2) {
      return file instanceof File ? file : new File([file], 'image.jpg', { type: file.type || 'image/jpeg' });
    }

    const scale = Math.min(maxWidth / width, maxHeight / height, 1);
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return file;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(
        (b) => resolve(b),
        'image/jpeg',
        quality
      );
    });

    if (!blob || blob.size >= file.size) {
      return file instanceof File ? file : new File([file], 'image.jpg', { type: file.type || 'image/jpeg' });
    }

    const baseName = (file.name || 'photo').replace(/\.[^.]+$/, '') || 'photo';
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now()
    });
  } catch (err) {
    console.warn('[compressImage] Falling back to original file:', err.message);
    return file instanceof File ? file : new File([file], 'image.jpg', { type: file.type || 'image/jpeg' });
  }
}

export default compressImageFile;
