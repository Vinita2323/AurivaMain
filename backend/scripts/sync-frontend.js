import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDist = path.resolve(__dirname, '../../frontend/dist');
const backendPublic = path.resolve(__dirname, '../public');

if (!fs.existsSync(frontendDist)) {
  console.error('❌ Error: frontend/dist not found! Please run "npm run build" in frontend directory first.');
  process.exit(1);
}

if (!fs.existsSync(backendPublic)) {
  fs.mkdirSync(backendPublic, { recursive: true });
}

fs.cpSync(frontendDist, backendPublic, { recursive: true, force: true });
console.log('✅ Successfully copied frontend/dist to backend/public!');
console.log('📁 Backend public folder is now ready to commit and push.');
