/**
 * Set the primary active admin login email and deactivate others.
 * Usage: node scripts/set-primary-admin-email.js Indgroup26@gmail.com
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

async function main() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/auriva_db');
  const { default: Admin } = await import('../src/models/Admin.js');
  const { ACCOUNT_STATUS } = await import('../src/constants/status.js');

  const before = await Admin.find({}).select('email name status');
  console.log(
    'Before:',
    before.map((a) => ({ email: a.email, status: a.status }))
  );

  let primary = await Admin.findOne({ email: NEW }).select('+password');
  if (!primary) {
    const preferred =
      (await Admin.findOne({ email: 'deepakmor7077@gmail.com' }).select('+password')) ||
      (await Admin.findOne({ email: 'admin@aurivafoods.com' }).select('+password')) ||
      (await Admin.findOne().sort({ createdAt: 1 }).select('+password'));

    if (!preferred) {
      console.error('No admin account found to rename.');
      process.exitCode = 1;
      await mongoose.disconnect();
      return;
    }

    const prev = preferred.email;
    preferred.email = NEW;
    await preferred.save();
    primary = preferred;
    console.log(`Renamed ${prev} → ${NEW}`);
  }

  primary.status = ACCOUNT_STATUS.ACTIVE;
  primary.password = 'Admin@123456';
  await primary.save();
  console.log('Primary active:', primary.email);

  const others = await Admin.find({ email: { $ne: NEW } });
  for (const a of others) {
    a.status = ACCOUNT_STATUS.INACTIVE;
    await a.save();
    console.log('Inactivated:', a.email);
  }

  const after = await Admin.find({}).select('email status');
  console.log(
    'After:',
    after.map((a) => ({ email: a.email, status: a.status }))
  );

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
