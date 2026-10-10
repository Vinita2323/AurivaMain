import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Notification from '../models/Notification.js';

const ACTIVE_ORDER_FILTER = { status: { $ne: 'CANCELLED' } };
const QUEUE_STATUSES = ['PENDING', 'CONFIRMED', 'ACCEPTED', 'PACKED', 'PROCESSING'];

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthLabel(date) {
  return date.toLocaleString('en-IN', { month: 'short' });
}

function pctChange(current, previous) {
  const cur = Number(current) || 0;
  const prev = Number(previous) || 0;
  if (prev <= 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}

function formatCompactInr(amount) {
  const n = Number(amount) || 0;
  if (n >= 100000) {
    return `₹${(n / 100000).toFixed(n >= 1000000 ? 1 : 1)}L`.replace('.0L', 'L');
  }
  if (n >= 1000) {
    return `₹${Math.round(n / 1000)}K`;
  }
  return `₹${Math.round(n)}`;
}

/**
 * Admin Executive Dashboard summary — live aggregations from MongoDB.
 */
export async function getDashboardSummary({ adminId = null } = {}) {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const lastMonthEnd = thisMonthStart;

  // Last 5 calendar months (including current) for revenue chart
  const chartMonths = [];
  for (let i = 4; i >= 0; i -= 1) {
    const start = startOfMonth(new Date(now.getFullYear(), now.getMonth() - i, 1));
    const end = startOfMonth(new Date(now.getFullYear(), now.getMonth() - i + 1, 1));
    chartMonths.push({ start, end, label: monthLabel(start) });
  }
  const chartRangeStart = chartMonths[0].start;

  const [
    revenueAgg,
    thisMonthRevenueAgg,
    lastMonthRevenueAgg,
    totalOrders,
    thisMonthOrders,
    lastMonthOrders,
    totalCustomers,
    thisMonthCustomers,
    lastMonthCustomers,
    repeatAgg,
    queueCount,
    productCount,
    couponCount,
    unreadNotifications,
    recentOrders,
    monthlyRevenueRows,
    topProductRows,
    deliveredCount
  ] = await Promise.all([
    Order.aggregate([
      { $match: ACTIVE_ORDER_FILTER },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } }
    ]),
    Order.aggregate([
      { $match: { ...ACTIVE_ORDER_FILTER, createdAt: { $gte: thisMonthStart } } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } }
    ]),
    Order.aggregate([
      {
        $match: {
          ...ACTIVE_ORDER_FILTER,
          createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd }
        }
      },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } }
    ]),
    Order.countDocuments(ACTIVE_ORDER_FILTER),
    Order.countDocuments({ ...ACTIVE_ORDER_FILTER, createdAt: { $gte: thisMonthStart } }),
    Order.countDocuments({
      ...ACTIVE_ORDER_FILTER,
      createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd }
    }),
    User.countDocuments({}),
    User.countDocuments({ createdAt: { $gte: thisMonthStart } }),
    User.countDocuments({ createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd } }),
    Order.aggregate([
      { $match: ACTIVE_ORDER_FILTER },
      { $group: { _id: '$user', orderCount: { $sum: 1 } } },
      { $match: { orderCount: { $gte: 2 } } },
      { $count: 'repeatCustomers' }
    ]),
    Order.countDocuments({ status: { $in: QUEUE_STATUSES } }),
    Product.countDocuments({}),
    Coupon.countDocuments({}),
    Notification.countDocuments({
      read: false,
      recipientRole: 'ADMIN',
      ...(adminId
        ? { $or: [{ recipient: null }, { recipient: adminId }] }
        : {})
    }),
    Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select(
        'orderNumber status pricing payment delivery shippingAddress createdAt courierName awbNumber'
      )
      .lean(),
    Order.aggregate([
      {
        $match: {
          ...ACTIVE_ORDER_FILTER,
          createdAt: { $gte: chartRangeStart }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 }
        }
      }
    ]),
    Order.aggregate([
      { $match: ACTIVE_ORDER_FILTER },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          image: { $first: '$items.image' },
          price: { $first: '$items.price' },
          sold: { $sum: '$items.qty' },
          revenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { sold: -1 } },
      { $limit: 4 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $addFields: {
          stockCount: {
            $ifNull: [{ $arrayElemAt: ['$product.stockCount', 0] }, 0]
          },
          image: {
            $ifNull: [{ $arrayElemAt: ['$product.image', 0] }, '$image']
          },
          name: {
            $ifNull: [{ $arrayElemAt: ['$product.name', 0] }, '$name']
          },
          price: {
            $ifNull: [{ $arrayElemAt: ['$product.price', 0] }, '$price']
          }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          image: 1,
          price: 1,
          sold: 1,
          revenue: 1,
          stockCount: 1
        }
      }
    ]),
    Order.countDocuments({ status: 'DELIVERED' })
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;
  const thisMonthRevenue = thisMonthRevenueAgg[0]?.total || 0;
  const lastMonthRevenue = lastMonthRevenueAgg[0]?.total || 0;
  const repeatCustomers = repeatAgg[0]?.repeatCustomers || 0;
  const repeatRate =
    totalCustomers > 0
      ? Math.round((repeatCustomers / totalCustomers) * 1000) / 10
      : 0;
  const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const deliveredRate =
    totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 1000) / 10 : 0;

  const monthlyMap = new Map(
    monthlyRevenueRows.map((row) => [
      `${row._id.year}-${row._id.month}`,
      { revenue: row.revenue || 0, orders: row.orders || 0 }
    ])
  );

  const revenueChart = chartMonths.map((m) => {
    const key = `${m.start.getFullYear()}-${m.start.getMonth() + 1}`;
    const row = monthlyMap.get(key) || { revenue: 0, orders: 0 };
    return {
      month: m.label,
      revenue: row.revenue,
      orders: row.orders,
      label: formatCompactInr(row.revenue)
    };
  });

  // If no sales yet in chart window, fall back to catalog top by stock for display
  let topProducts = topProductRows.map((p) => ({
    id: p._id?.toString(),
    name: p.name || 'Product',
    image: typeof p.image === 'string' ? p.image : '',
    price: p.price || 0,
    stockCount: p.stockCount ?? 0,
    sold: p.sold || 0
  }));

  if (topProducts.length === 0) {
    const catalog = await Product.find({})
      .sort({ stockCount: -1, createdAt: -1 })
      .limit(4)
      .select('name price stockCount image')
      .lean();
    topProducts = catalog.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      image: p.image || '',
      price: p.price || 0,
      stockCount: p.stockCount ?? 0,
      sold: 0
    }));
  }

  return {
    kpis: {
      totalRevenue,
      revenueTrendPct: pctChange(thisMonthRevenue, lastMonthRevenue),
      totalOrders,
      ordersTrendPct: pctChange(thisMonthOrders, lastMonthOrders),
      totalCustomers,
      customersTrendPct: pctChange(thisMonthCustomers, lastMonthCustomers),
      repeatCustomers,
      repeatRate
    },
    quick: {
      productCount,
      queueCount,
      couponCount,
      unreadNotifications
    },
    aov,
    deliveredRate,
    revenueChart,
    topProducts,
    recentOrders
  };
}

export default { getDashboardSummary };
