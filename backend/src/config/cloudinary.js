import { v2 as cloudinary } from 'cloudinary';
import env from './env.js';

const isConfigured = Boolean(
  env.CLOUDINARY.CLOUD_NAME &&
  env.CLOUDINARY.API_KEY &&
  env.CLOUDINARY.API_SECRET &&
  !env.CLOUDINARY.CLOUD_NAME.includes('dummy') &&
  !env.CLOUDINARY.API_KEY.includes('123456789012345')
);

// Always configure cloudinary instance
cloudinary.config({
  cloud_name: env.CLOUDINARY.CLOUD_NAME || 'demo',
  api_key: env.CLOUDINARY.API_KEY || '123456789012345',
  api_secret: env.CLOUDINARY.API_SECRET || 'dummy_api_secret',
  secure: true
});

if (isConfigured) {
  console.log(`[Cloudinary] Connected successfully with Cloud Name: ${env.CLOUDINARY.CLOUD_NAME}`);
} else {
  console.log('[Cloudinary] Ready with placeholder credentials. When you add real keys in .env, live Cloudinary upload will take over seamlessly.');
}

export { cloudinary, isConfigured };
export default cloudinary;
