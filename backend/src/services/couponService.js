import mongoose from 'mongoose';
import Coupon from '../models/Coupon.js';
import { HTTP_STATUS } from '../constants/status.js';

class CouponService {
  /**
   * Admin: Create a new promotional Coupon rule
   */
  static async createCoupon(payload) {
    const cleanCode = (payload.code || '').trim().toUpperCase();
    if (!cleanCode) {
      const err = new Error('Coupon code is required.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      const err = new Error(`Coupon code "${cleanCode}" already exists.`);
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    const couponData = {
      code: cleanCode,
      description: payload.description || '',
      discountType: (payload.discountType || 'PERCENTAGE').toUpperCase(),
      discountValue: Number(payload.discountValue || 0),
      minOrderValue: Number(payload.minOrderValue || 0),
      maxDiscount: Number(payload.maxDiscount || 0),
      startDate: payload.startDate ? new Date(payload.startDate) : new Date(),
      endDate: payload.endDate ? new Date(payload.endDate) : null,
      usageLimit: Number(payload.usageLimit || 0),
      status: (payload.status || 'ACTIVE').toUpperCase()
    };

    const coupon = new Coupon(couponData);
    await coupon.save();
    return coupon;
  }

  /**
   * Admin: Get all coupons with filtering, search, and pagination
   */
  static async getAllCouponsAdmin(query = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sort = '-createdAt'
    } = query;

    const filter = {};

    if (status && status !== 'ALL' && status !== 'all') {
      filter.status = status.toUpperCase();
    }

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { code: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [coupons, totalCount] = await Promise.all([
      Coupon.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Coupon.countDocuments(filter)
    ]);

    return {
      coupons,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalItems: totalCount
      }
    };
  }

  /**
   * Admin: Get single coupon by ID
   */
  static async getCouponByIdAdmin(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error('Invalid coupon ID format');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      const err = new Error('Coupon not found');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    return coupon;
  }

  /**
   * Admin: Update existing coupon
   */
  static async updateCouponAdmin(id, updateData) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error('Invalid coupon ID format');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      const err = new Error('Coupon not found');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    if (updateData.code) {
      const cleanCode = updateData.code.trim().toUpperCase();
      if (cleanCode !== coupon.code) {
        const existing = await Coupon.findOne({ code: cleanCode });
        if (existing) {
          const err = new Error(`Coupon code "${cleanCode}" is already taken by another rule.`);
          err.statusCode = HTTP_STATUS.BAD_REQUEST;
          throw err;
        }
        coupon.code = cleanCode;
      }
    }

    if (updateData.description !== undefined) coupon.description = updateData.description;
    if (updateData.discountType) coupon.discountType = updateData.discountType.toUpperCase();
    if (updateData.discountValue !== undefined) coupon.discountValue = Number(updateData.discountValue);
    if (updateData.minOrderValue !== undefined) coupon.minOrderValue = Number(updateData.minOrderValue);
    if (updateData.maxDiscount !== undefined) coupon.maxDiscount = Number(updateData.maxDiscount);
    if (updateData.startDate !== undefined) coupon.startDate = updateData.startDate ? new Date(updateData.startDate) : coupon.startDate;
    if (updateData.endDate !== undefined) coupon.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
    if (updateData.usageLimit !== undefined) coupon.usageLimit = Number(updateData.usageLimit);
    if (updateData.status) coupon.status = updateData.status.toUpperCase();

    await coupon.save();
    return coupon;
  }

  /**
   * Admin: Delete coupon
   */
  static async deleteCouponAdmin(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error('Invalid coupon ID format');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      const err = new Error('Coupon not found');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    return { success: true, message: `Coupon "${coupon.code}" deleted successfully` };
  }

  /**
   * Customer / Checkout: Validate coupon and calculate authoritatively
   * Never trusts frontend discount values.
   */
  static async validateCoupon({ code, subtotal = 0 }) {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      const err = new Error('Coupon code is required.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    const coupon = await Coupon.findOne({ code: cleanCode });
    if (!coupon) {
      const err = new Error(`Invalid or non-existent coupon code "${cleanCode}".`);
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    // 1. Status Check
    if (coupon.status !== 'ACTIVE') {
      const err = new Error(`Coupon code "${cleanCode}" is currently inactive.`);
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    // 2. Validity Date Window Check
    const now = new Date();
    if (coupon.startDate && now < new Date(coupon.startDate)) {
      const err = new Error(`Coupon code "${cleanCode}" is not active yet.`);
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    if (coupon.endDate && now > new Date(coupon.endDate)) {
      const err = new Error(`Coupon code "${cleanCode}" has expired.`);
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    // 3. Usage Limit Check
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      const err = new Error(`Coupon code "${cleanCode}" usage limit has been reached.`);
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    // 4. Minimum Order Value Check
    const orderSubtotal = Math.max(0, Number(subtotal) || 0);
    if (coupon.minOrderValue > 0 && orderSubtotal < coupon.minOrderValue) {
      const err = new Error(
        `Minimum order amount of ₹${coupon.minOrderValue} is required to apply coupon "${cleanCode}".`
      );
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      err.minOrderValue = coupon.minOrderValue;
      throw err;
    }

    // 5. Authoritative Discount Calculation
    let calculatedDiscount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      calculatedDiscount = Math.round((orderSubtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount > 0) {
        calculatedDiscount = Math.min(calculatedDiscount, coupon.maxDiscount);
      }
    } else if (coupon.discountType === 'FIXED') {
      calculatedDiscount = Math.min(coupon.discountValue, orderSubtotal);
    }

    const finalDiscount = Math.max(0, Math.min(calculatedDiscount, orderSubtotal));

    return {
      isValid: true,
      coupon: {
        id: coupon._id.toString(),
        _id: coupon._id.toString(),
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue,
        maxDiscount: coupon.maxDiscount,
        usageLimit: coupon.usageLimit,
        usedCount: coupon.usedCount,
        startDate: coupon.startDate,
        endDate: coupon.endDate
      },
      subtotal: orderSubtotal,
      discount: finalDiscount,
      finalSubtotal: orderSubtotal - finalDiscount
    };
  }

  /**
   * Order Placement: Safely increment coupon usedCount atomically
   * Protects against race conditions & double-counting.
   */
  static async incrementCouponUsage(couponId) {
    if (!couponId || !mongoose.Types.ObjectId.isValid(couponId)) {
      return null;
    }

    // Atomic update: only increments if coupon is ACTIVE and under usageLimit (if limit > 0)
    const updated = await Coupon.findOneAndUpdate(
      {
        _id: couponId,
        status: 'ACTIVE',
        $or: [
          { usageLimit: { $exists: false } },
          { usageLimit: null },
          { usageLimit: 0 },
          { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
        ]
      },
      { $inc: { usedCount: 1 } },
      { new: true }
    );

    if (!updated) {
      const err = new Error('Failed to consume coupon: Limit reached or coupon became inactive.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    return updated;
  }

  /**
   * System Startup Seed: Populate initial coupons if none exist
   */
  static async seedInitialCoupons() {
    const count = await Coupon.countDocuments();
    if (count > 0) return;

    const initialData = [
      {
        code: 'WELCOME20',
        description: '20% off on your first order above ₹499',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minOrderValue: 499,
        maxDiscount: 150,
        status: 'ACTIVE'
      },
      {
        code: 'AURIVA20',
        description: 'Special 20% discount on all roasted snacks',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minOrderValue: 499,
        maxDiscount: 200,
        status: 'ACTIVE'
      },
      {
        code: 'FIRST15',
        description: '15% off for all registered members',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        minOrderValue: 399,
        maxDiscount: 100,
        status: 'ACTIVE'
      },
      {
        code: 'FESTIVE25',
        description: 'Festival celebration saving 25%',
        discountType: 'PERCENTAGE',
        discountValue: 25,
        minOrderValue: 999,
        maxDiscount: 300,
        status: 'ACTIVE'
      },
      {
        code: 'FLAT100',
        description: 'Flat ₹100 discount on orders above ₹699',
        discountType: 'FIXED',
        discountValue: 100,
        minOrderValue: 699,
        status: 'ACTIVE'
      }
    ];

    await Coupon.insertMany(initialData);
    console.log(`[Coupon Seed] Initialized ${initialData.length} promotional coupons.`);
  }
}

export default CouponService;
