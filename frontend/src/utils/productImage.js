import periPeriImg from '../assets/user/Types/PeriPeri.jpeg';
import creamOnionImg from '../assets/user/Types/CreamOnion.jpeg';
import tomatoImg from '../assets/user/Types/Tomato.jpeg';
import classicMakhanaImg from '../assets/user/Classic Makhana.jpg';
import flavoredMakhanaImg from '../assets/user/Flavored Makhana.jpg';
import premiumMakhanaImg from '../assets/user/Premium Makhana.jpg';
import healthyMakhanaImg from '../assets/user/Healthy Makhana2.jpg';
import comboMakhanaImg from '../assets/user/combo Makhana.jpg';

// Flavor and category keyword mapping to authentic Aurivá product images
export const FLAVOR_IMAGE_MAP = [
  { keywords: ['truffle', 'herb', 'artisanal', 'premium', 'gourmet', 'exotic'], image: premiumMakhanaImg },
  { keywords: ['peri', 'african', 'chilli', 'spicy', 'chili'], image: periPeriImg },
  { keywords: ['cream', 'onion', 'cheese', 'sour cream'], image: creamOnionImg },
  { keywords: ['tomato', 'tangy', 'sun-dried', 'italian'], image: tomatoImg },
  { keywords: ['salted', 'w240', 'classic', 'himalayan', 'plain', 'salt'], image: classicMakhanaImg },
  { keywords: ['masala', 'chatpata', 'spice', 'royal indian'], image: flavoredMakhanaImg },
  { keywords: ['pudina', 'mint', 'healthy', 'fitness', 'spearmint'], image: healthyMakhanaImg },
  { keywords: ['combo', 'pack of', 'gifting', 'bundle', 'tubs'], image: comboMakhanaImg },
];

// Mapping table for legacy /src/assets paths stored in the DB or seed data
export const STATIC_ASSET_MAP = {
  // Legacy /src/assets paths stored in MongoDB or backend seed data
  '/src/assets/user/flavored makhana.jpg': flavoredMakhanaImg,
  '/src/assets/user/classic makhana.jpg': classicMakhanaImg,
  '/src/assets/user/healthy makhana2.jpg': healthyMakhanaImg,
  '/src/assets/user/healthy makhana.jpg': healthyMakhanaImg,
  '/src/assets/user/premium makhana.jpg': premiumMakhanaImg,
  '/src/assets/user/combo makhana.jpg': comboMakhanaImg,
  '/src/assets/user/types/periperi.jpeg': periPeriImg,
  '/src/assets/user/types/periperi.jpg': periPeriImg,
  '/src/assets/user/types/creamonion.jpeg': creamOnionImg,
  '/src/assets/user/types/creamonion.jpg': creamOnionImg,
  '/src/assets/user/types/tomato.jpeg': tomatoImg,
  '/src/assets/user/types/tomato.jpg': tomatoImg,

  // Also map without /src prefix (e.g. /assets/user/...)
  '/assets/user/flavored makhana.jpg': flavoredMakhanaImg,
  '/assets/user/classic makhana.jpg': classicMakhanaImg,
  '/assets/user/healthy makhana2.jpg': healthyMakhanaImg,
  '/assets/user/healthy makhana.jpg': healthyMakhanaImg,
  '/assets/user/premium makhana.jpg': premiumMakhanaImg,
  '/assets/user/combo makhana.jpg': comboMakhanaImg,
  '/assets/user/types/periperi.jpeg': periPeriImg,
  '/assets/user/types/periperi.jpg': periPeriImg,
  '/assets/user/types/creamonion.jpeg': creamOnionImg,
  '/assets/user/types/creamonion.jpg': creamOnionImg,
  '/assets/user/types/tomato.jpeg': tomatoImg,
  '/assets/user/types/tomato.jpg': tomatoImg,

  // Direct basename mapping as fallback
  'flavored makhana.jpg': flavoredMakhanaImg,
  'classic makhana.jpg': classicMakhanaImg,
  'healthy makhana2.jpg': healthyMakhanaImg,
  'healthy makhana.jpg': healthyMakhanaImg,
  'premium makhana.jpg': premiumMakhanaImg,
  'combo makhana.jpg': comboMakhanaImg,
  'periperi.jpeg': periPeriImg,
  'creamonion.jpeg': creamOnionImg,
  'tomato.jpeg': tomatoImg,
};

/**
 * Universal Snack Product Image Resolver
 * Accurately determines product image across Admin, Catalog, Detail, and Bestsellers.
 * Ensures consistent visual representation across both development and production builds.
 * Accepts either a product object OR an image URL string.
 */
export function resolveProductImage(productOrUrl) {
  if (!productOrUrl) return periPeriImg;

  // Support both product object and raw image string/URL
  const rawImg = typeof productOrUrl === 'string'
    ? productOrUrl
    : (productOrUrl.image || productOrUrl.gallery?.[0] || '');
  const img = typeof rawImg === 'string' ? rawImg.trim() : '';

  // 1. Direct match in static asset map (handles legacy /src/assets paths, url-encoded or lowercased)
  if (img) {
    try {
      const decoded = decodeURIComponent(img).toLowerCase();
      if (STATIC_ASSET_MAP[decoded]) {
        return STATIC_ASSET_MAP[decoded];
      }
      // Check basename match (e.g. "flavored makhana.jpg")
      const basename = decoded.split('/').pop();
      if (basename && STATIC_ASSET_MAP[basename]) {
        return STATIC_ASSET_MAP[basename];
      }
    } catch {
      // Ignore URI decode errors
    }
  }

  // 2. Real user-uploaded photo (Cloudinary, base64 data URL, local uploads)
  if (
    img &&
    (img.includes('cloudinary') ||
     img.startsWith('data:image') ||
     img.includes('/uploads/') ||
     img.includes('res.cloudinary.com'))
  ) {
    return img;
  }

  // 3. Valid external URL (AND NOT the legacy placeholder fish image)
  if (
    img &&
    img.startsWith('http') &&
    !img.includes('1599488615731') &&
    !img.includes('photo-1599488615731')
  ) {
    return img;
  }

  // 4. If it's already an imported Vite bundle asset (e.g. /assets/name-hash.ext) or blob URL
  // NOTE: We deliberately do NOT check '/src/assets' here because that is an unbundled dev path!
  if (img && (img.startsWith('/assets/') || img.startsWith('blob:'))) {
    return img;
  }

  // 5. Match based on product name, flavor, slug, or subtitle (if an object was passed)
  const productObj = typeof productOrUrl === 'object' ? productOrUrl : null;
  if (productObj) {
    const searchStr = `${productObj.name || ''} ${productObj.flavor || ''} ${productObj.slug || ''} ${productObj.subtitle || ''} ${productObj.tagline || ''}`.toLowerCase();
    for (const entry of FLAVOR_IMAGE_MAP) {
      if (entry.keywords.some(kw => searchStr.includes(kw))) {
        return entry.image;
      }
    }
  }

  // 6. If image exists and is NOT the fish placeholder and NOT an unbundled /src/ path, return it
  if (img && !img.includes('1599488615731') && !img.startsWith('/src/')) {
    return img;
  }

  // 7. Default fallback
  return periPeriImg;
}
