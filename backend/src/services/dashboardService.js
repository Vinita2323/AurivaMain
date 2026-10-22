import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Notification from '../models/Notification.js';

// Revenue / GMV: exclude cancelled + failed payments (COD PENDING still counts as booked GMV)
const ACTIVE_ORDER_FILTER = {
  status: { $ne: 'CANCELLED' },
  'payment.status': { $nin: ['FAILED'] }
};
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

const DAY_MS = 24 * 60 * 60 * 1000;

/** Valid IANA timezone or 'UTC' */
function safeTimezone(tz) {
  try {
    if (tz) {
      new Intl.DateTimeFormat('en-CA', { timeZone: String(tz) });
      return String(tz);
    }
  } catch {
    /* fall through */
  }
  return 'UTC';
}

/**
 * Resolve the analytics window.
 * The browser sends exact instants (from = inclusive start, to = exclusive end) computed in the admin's own
 * timezone, plus that timezone's name, so results never depend on the server's timezone.
 * Legacy plain "YYYY-MM-DD" values are still accepted (interpreted in the given timezone's UTC day).
 */
function resolveAnalyticsRange({ range = 'monthly', from = null, to = null, tz = null } = {}) {
  const timezone = safeTimezone(tz);
  const parse = (v, endOfDay) => {
    if (!v) return null;
    const str = String(v).trim();
    const d = /^\d{4}-\d{2}-\d{2}$/.test(str)
      ? new Date(`${str}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`)
      : new Date(str);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  let start = parse(from, false);
  let end = parse(to, true);
  let key = 'custom';

  if (!start) {
    // No explicit window supplied: fall back to a preset measured back from now
    const now = new Date();
    key = ['weekly', 'monthly', 'quarterly', 'yearly'].includes(range) ? range : 'monthly';
    end = new Date(now.getTime() + DAY_MS);
    const days = { weekly: 7, monthly: 31, quarterly: 92, yearly: 366 }[key];
    start = new Date(end.getTime() - days * DAY_MS);
  }
  if (!end || end <= start) end = new Date(start.getTime() + DAY_MS);

  const spanDays = (end.getTime() - start.getTime()) / DAY_MS;
  const bucket = spanDays > 62 ? 'month' : 'day';
  return { start, end, bucket, key, timezone };
}

/** "2026-10-22" for an instant, as seen in a timezone */
const dayKeyInTz = (date, timezone) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

/**
 * Admin Analytics - every figure is aggregated live from orders in the selected window.
 */
export async function getAnalyticsSummary(options = {}) {
  const { start, end, bucket, key, timezone } = resolveAnalyticsRange(options);
  const span = end.getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - span);
  const inRange = { ...ACTIVE_ORDER_FILTER, createdAt: { $gte: start, $lt: end } };
  const inPrev = { ...ACTIVE_ORDER_FILTER, createdAt: { $gte: prevStart, $lt: start } };

  const [totalsAgg, prevAgg, bucketAgg, channelAgg, topRows, allCount, deliveredCount] = await Promise.all([
    Order.aggregate([{ $match: inRange }, { $group: { _id: null, revenue: { $sum: '$pricing.total' }, orders: { $sum: 1 } } }]),
    Order.aggregate([{ $match: inPrev }, { $group: { _id: null, revenue: { $sum: '$pricing.total' }, orders: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: inRange },
      {
        $group: {
          // Bucket by the admin's local day / month, not by UTC
          _id: {
            $dateToString: {
              format: bucket === 'month' ? '%Y-%m' : '%Y-%m-%d',
              date: '$createdAt',
              timezone
            }
          },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 }
        }
      }
    ]),
    Order.aggregate([
      { $match: inRange },
      { $group: { _id: { $ifNull: ['$delivery.type', 'Standard Delivery'] }, orders: { $sum: 1 }, revenue: { $sum: '$pricing.total' } } },
      { $sort: { orders: -1 } }
    ]),
    Order.aggregate([
      { $match: inRange },
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
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      {
        $project: {
          name: { $ifNull: [{ $arrayElemAt: ['$product.name', 0] }, '$name'] },
          image: { $ifNull: [{ $arrayElemAt: ['$product.image', 0] }, '$image'] },
          flavor: { $ifNull: [{ $arrayElemAt: ['$product.flavor', 0] }, ''] },
          price: { $ifNull: [{ $arrayElemAt: ['$product.price', 0] }, '$price'] },
          stockCount: { $ifNull: [{ $arrayElemAt: ['$product.stockCount', 0] }, 0] },
          sold: 1,
          revenue: 1
        }
      }
    ]),
    Order.countDocuments({ createdAt: { $gte: start, $lt: end }, status: { $ne: 'CANCELLED' } }),
    Order.countDocuments({ createdAt: { $gte: start, $lt: end }, status: 'DELIVERED' })
  ]);

  const revenue = totalsAgg[0]?.revenue || 0;
  const orders = totalsAgg[0]?.orders || 0;
  const prevRevenue = prevAgg[0]?.revenue || 0;
  const prevOrders = prevAgg[0]?.orders || 0;
  const aov = orders > 0 ? Math.round(revenue / orders) : 0;
  const prevAov = prevOrders > 0 ? Math.round(prevRevenue / prevOrders) : 0;

  // Fill every bucket in the window (zeros included) so the chart is continuous
  const lookup = new Map(bucketAgg.map((r) => [r._id, r]));
  const series = [];
  const lastInstant = new Date(end.getTime() - 1);

  if (bucket === 'month') {
    const [sy, sm] = dayKeyInTz(start, timezone).split('-').map(Number);
    const [ey, em] = dayKeyInTz(lastInstant, timezone).split('-').map(Number);
    let y = sy;
    let m = sm;
    while (y < ey || (y === ey && m <= em)) {
      const k = `${y}-${String(m).padStart(2, '0')}`;
      const row = lookup.get(k);
      series.push({
        label: new Date(Date.UTC(y, m - 1, 15)).toLocaleString('en-IN', { month: 'short', timeZone: 'UTC' }),
        revenue: row?.revenue || 0,
        orders: row?.orders || 0
      });
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
  } else {
    const seen = new Set();
    for (let t = start.getTime(); t < end.getTime(); t += DAY_MS) {
      const d = new Date(t);
      const k = dayKeyInTz(d, timezone);
      if (seen.has(k)) continue; // DST safety
      seen.add(k);
      const row = lookup.get(k);
      series.push({
        label: d.toLocaleString('en-IN', { day: '2-digit', month: 'short', timeZone: timezone }),
        revenue: row?.revenue || 0,
        orders: row?.orders || 0
      });
    }
  }
  const best = series.reduce((m, pt) => (pt.revenue > (m?.revenue ?? 0) ? pt : m), null);

  return {
    range: { key, from: start.toISOString(), to: lastInstant.toISOString(), bucket, timezone },
    kpis: {
      revenue,
      revenueTrendPct: pctChange(revenue, prevRevenue),
      orders,
      ordersTrendPct: pctChange(orders, prevOrders),
      aov,
      aovDelta: aov - prevAov,
      deliveredRate: allCount > 0 ? Math.round((deliveredCount / allCount) * 100) : 0,
      deliveredOrders: deliveredCount
    },
    series,
    bestPeriod: best && best.revenue > 0 ? best.label : null,
    channels: channelAgg.map((c) => ({
      name: c._id,
      orders: c.orders,
      revenue: c.revenue,
      percent: orders > 0 ? Math.round((c.orders / orders) * 100) : 0
    })),
    topProducts: topRows.map((r) => ({
      id: r._id?.toString(),
      name: r.name || 'Product',
      flavor: r.flavor || '',
      image: typeof r.image === 'string' ? r.image : '',
      price: r.price || 0,
      sold: r.sold || 0,
      revenue: r.revenue || 0,
      stockCount: r.stockCount ?? 0
    }))
  };
}

export default { getDashboardSummary, getAnalyticsSummary };
