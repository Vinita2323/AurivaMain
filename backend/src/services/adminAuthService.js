import Admin from '../models/Admin.js';
import { generateToken } from '../utils/generateToken.js';
import { ROLES } from '../constants/roles.js';
import { ACCOUNT_STATUS, HTTP_STATUS } from '../constants/status.js';

class AdminAuthService {
  /**
   * Authenticate admin with email and password
   * @param {object} credentials
   * @param {string} credentials.email
   * @param {string} credentials.password
   * @returns {Promise<{ token: string, admin: object }>}
   */
  async loginAdmin({ email, password }) {
    if (!email || !password) {
      const err = new Error('Email and password are required.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query admin including hidden password field
    const admin = await Admin.findOne({ email: normalizedEmail }).select('+password');

    if (!admin) {
      const err = new Error('Invalid email or password.');
      err.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw err;
    }

    // Verify password securely using bcrypt
    const isPasswordMatch = await admin.comparePassword(password);
    if (!isPasswordMatch) {
      const err = new Error('Invalid email or password.');
      err.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw err;
    }

    // Check admin account status
    if (admin.status === ACCOUNT_STATUS.BLOCKED) {
      const err = new Error('This admin account has been suspended.');
      err.statusCode = HTTP_STATUS.FORBIDDEN;
      throw err;
    }

    if (admin.status === ACCOUNT_STATUS.INACTIVE) {
      const err = new Error('This admin account is currently inactive.');
      err.statusCode = HTTP_STATUS.FORBIDDEN;
      throw err;
    }

    // Update last login timestamp
    admin.lastLoginAt = new Date();
    await admin.save();

    // Issue JWT with explicit ADMIN role
    const token = generateToken({
      id: admin._id.toString(),
      role: ROLES.ADMIN,
      email: admin.email
    });

    return {
      token,
      admin: admin.toJSON()
    };
  }

  /**
   * Fetch admin profile by ID
   * @param {string} adminId
   * @returns {Promise<object>}
   */
  async getAdminProfile(adminId) {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      const err = new Error('Admin profile not found.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }
    return admin.toJSON();
  }

  /**
   * Ensure initial default super admin exists on server boot
   */
  async ensureDefaultAdmin() {
    try {
      const adminCount = await Admin.countDocuments();
      if (adminCount === 0) {
        const defaultEmail = 'admin@aurivafoods.com';
        const defaultPassword = 'Admin@123456';
        
        await Admin.create({
          name: 'Super Admin',
          email: defaultEmail,
          password: defaultPassword,
          role: ROLES.ADMIN,
          status: ACCOUNT_STATUS.ACTIVE,
          permissions: ['SUPER_ADMIN']
        });

        console.log(`[Admin Seeding] Seeded initial Super Admin account: ${defaultEmail}`);
      }
    } catch (error) {
      console.error('[Admin Seeding Error] Could not seed default admin:', error.message);
    }
  }
}

export const adminAuthService = new AdminAuthService();
export default adminAuthService;
