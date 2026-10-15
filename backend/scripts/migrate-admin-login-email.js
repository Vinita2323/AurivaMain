/**
 * One-off: migrate Super Admin login email to ADMIN_LOGIN_EMAIL (or CLI arg).
 * Usage: node scripts/migrate-admin-login-email.js [newEmail]
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const NEW = String(process.argv[2] || process.env.ADMIN_LOGIN_EMAIL || 'Indgroup26@gmail.com')
  .trim()
  .toLowerCase();
const LEGACY_CANDIDATES = [
  'admin@aurivafoods.com',
  'deepakmor7077@gmail.com'
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/auriva_db');
  const { default: Admin } = await import('../src/models/Admin.js');

  let target = await Admin.findOne({ email: NEW });
  if (target) {
    console.log('Admin already uses:', target.email);
  } else {
    let legacy = null;
    for (const candidate of LEGACY_CANDIDATES) {
      legacy = await Admin.findOne({ email: candidate });
      if (legacy) break;
    }
    if (!legacy) {
      legacy = await Admin.findOne().sort({ createdAt: 1 });
    }

    if (!legacy) {
      console.error('No admin account found.');
      process.exitCode = 1;
    } else {
      const prev = legacy.email;
      legacy.email = NEW;
      await legacy.save();
      console.log(`Migrated ${prev} → ${NEW}`);
    }
  }

  const check = await Admin.findOne({ email: NEW });
  console.log('Current login email:', check?.email || 'MISSING');
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
