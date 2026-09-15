import periPeriImg from '../assets/user/Types/PeriPeri.jpeg';
import creamOnionImg from '../assets/user/Types/CreamOnion.jpeg';
import tomatoImg from '../assets/user/Types/Tomato.jpeg';
import classicMakhanaImg from '../assets/user/Classic Makhana.jpg';
import flavoredMakhanaImg from '../assets/user/Flavored Makhana.jpg';
import premiumMakhanaImg from '../assets/user/Premium Makhana.jpg';
import healthyMakhanaImg from '../assets/user/Healthy Makhana2.jpg';
import comboMakhanaImg from '../assets/user/combo Makhana.jpg';

// Flavor and category keyword mapping to authentic Aurivá product images
const FLAVOR_IMAGE_MAP = [
  { keywords: ['truffle', 'herb', 'artisanal', 'premium', 'gourmet', 'exotic'], image: premiumMakhanaImg },
  { keywords: ['peri', 'african', 'chilli', 'spicy', 'chili'], image: periPeriImg },
  { keywords: ['cream', 'onion', 'cheese', 'sour cream'], image: creamOnionImg },
  { keywords: ['tomato', 'tangy', 'sun-dried', 'italian'], image: tomatoImg },
  { keywords: ['salted', 'w240', 'classic', 'himalayan', 'plain', 'salt'], image: classicMakhanaImg },
  { keywords: ['masala', 'chatpata', 'spice', 'royal indian'], image: flavoredMakhanaImg },
  { keywords: ['pudina', 'mint', 'healthy', 'fitness', 'spearmint'], image: healthyMakhanaImg },
  { keywords: ['combo', 'pack of', 'gifting', 'bundle', 'tubs'], image: comboMakhanaImg },
];

/**
 * Universal Snack Product Image Resolver
 * Accurately determines product image across Admin, Catalog, Detail, and Bestsellers.
 * Ensures consistent visual representation across the entire platform.
 */
export function resolveProductImage(product) {
  if (!product) return periPeriImg;

  const rawImg = product.image || product.gallery?.[0] || '';
  const img = typeof rawImg === 'string' ? rawImg.trim() : '';

  // 1. If it's a real user-uploaded photo (Cloudinary, base64 data URL, local uploads)
  if (
    img &&
    (img.includes('cloudinary') ||
     img.startsWith('data:image') ||
     img.includes('/uploads/') ||
     img.includes('res.cloudinary.com'))
  ) {
    return img;
  }

  // 2. If it's a valid external URL (AND NOT the legacy placeholder fish image)
  if (
    img &&
    img.startsWith('http') &&
    !img.includes('1599488615731') &&
    !img.includes('photo-1599488615731')
  ) {
    return img;
  }

  // 3. If it's already an imported Vite asset or blob URL
  if (img && (img.startsWith('/assets') || img.startsWith('/src/assets') || img.startsWith('blob:'))) {
    return img;
  }

  // 4. Match based on product name, flavor, slug, or subtitle
  const searchStr = `${product.name || ''} ${product.flavor || ''} ${product.slug || ''} ${product.subtitle || ''} ${product.tagline || ''}`.toLowerCase();

  for (const entry of FLAVOR_IMAGE_MAP) {
    if (entry.keywords.some(kw => searchStr.includes(kw))) {
      return entry.image;
    }
  }

  // 5. If image exists and is NOT the fish placeholder, return it
  if (img && !img.includes('1599488615731')) {
    return img;
  }

  // 6. Default fallback
  return periPeriImg;
}
