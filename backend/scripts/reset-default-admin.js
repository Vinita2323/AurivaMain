/**
 * One-shot: create/reset default Super Admin credentials.
 * Usage: node scripts/reset-default-admin.js
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Admin from '../src/models/Admin.js';
import { ROLES } from '../src/constants/roles.js';
import { ACCOUNT_STATUS } from '../src/constants/status.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const email = 'admin@aurivafoods.com';
const password = 'Admin@123456';

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/auriva_db';
  await mongoose.connect(uri);

  let admin = await Admin.findOne({ email }).select('+password');
  if (!admin) {
    admin = await Admin.create({
      name: 'Super Admin',
      email,
      password,
      role: ROLES.ADMIN,
      status: ACCOUNT_STATUS.ACTIVE,
      permissions: ['SUPER_ADMIN']
    });
    console.log('Created default admin:', email);
  } else {
    admin.password = password;
    admin.status = ACCOUNT_STATUS.ACTIVE;
    await admin.save();
    const ok = await admin.comparePassword(password);
    console.log('Reset admin password for:', email, '| verify:', ok);
  }

  const all = await Admin.find({}).select('email status name');
  console.log('Admins in DB:', all.map((a) => ({ email: a.email, status: a.status, name: a.name })));
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
