import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import shiprocketClient from '../src/services/shiprocketClient.js';
import settingsService from '../src/services/settingsService.js';
import { resolveDeliveryFee } from '../src/utils/pricing.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function pickCourierRate(courier) {
  if (!courier) return null;
  const candidates = [
    courier.rate,
    courier.freight_charge,
    courier.total_charges,
    courier.charge,
    courier.cod_charges,
    courier.estimated_delivery_days
  ];
  const rate = Number(courier.rate ?? courier.freight_charge ?? courier.total_charges ?? courier.charge);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

async function quotePincode({ pickup, delivery, weight, cod, settings, subtotal = 301 }) {
  const dbOnline = resolveDeliveryFee({ subtotal, paymentMethod: 'UPI', settings });
  const dbCod = resolveDeliveryFee({ subtotal, paymentMethod: 'COD', settings });

  let sr = { available: false, couriers: [], error: null };
  try {
    const data = await shiprocketClient.checkServiceability({
      pickupPostcode: pickup,
      deliveryPostcode: delivery,
      weight,
      cod
    });
    sr.couriers = data?.data?.available_courier_companies || [];
    sr.available = sr.couriers.length > 0;
  } catch (e) {
    sr.error = e.message;
  }

  const rates = sr.couriers
    .map((c) => ({
      name: c.courier_name,
      id: c.courier_company_id,
      rate: pickCourierRate(c),
      etd: c.estimated_delivery_days,
      recommended: Boolean(c.recommended_by)
    }))
    .filter((c) => c.rate != null);

  const cheapest = rates.length ? Math.min(...rates.map((r) => r.rate)) : null;
  const recommended = rates.find((r) => r.recommended) || rates[0] || null;

  return {
    pickup,
    delivery,
    weight,
    cod: cod ? 'COD' : 'Prepaid',
    dbOnline,
    dbCod,
    shiprocketCheapest: cheapest,
    shiprocketRecommended: recommended?.rate ?? null,
    recommendedCourier: recommended?.name ?? null,
    courierCount: rates.length,
    sampleCouriers: rates.slice(0, 5),
    error: sr.error
  };
}

await mongoose.connect(process.env.MONGO_URI);
const settings = await settingsService.getSettings();

console.log('\n=== Store DB shipping settings ===');
console.log({
  freeDeliveryThreshold: settings.freeDeliveryThreshold,
  onlineFee: settings.standardDeliveryFee,
  codFee: settings.codDeliveryFee,
  warehousePincode: settings.warehousePincode
});

const pickup = settings.warehousePincode || process.env.SHIPROCKET_PICKUP_PINCODE || '131001';

const samples = [
  { delivery: '452003', weight: 0.2, subtotal: 301 },
  { delivery: '452001', weight: 0.5, subtotal: 800 },
  { delivery: '110001', weight: 0.2, subtotal: 301 }
];

for (const s of samples) {
  console.log('\n--- Prepaid ---');
  console.log(JSON.stringify(await quotePincode({ ...s, pickup, cod: 0, settings }), null, 2));
  console.log('\n--- COD ---');
  console.log(JSON.stringify(await quotePincode({ ...s, pickup, cod: 1, settings }), null, 2));
}

const orders = await mongoose.connection.db
  .collection('orders')
  .find({})
  .sort({ createdAt: -1 })
  .limit(3)
  .project({ orderNumber: 1, 'pricing.deliveryFee': 1, 'pricing.total': 1, 'payment.method': 1, 'shippingAddress.postalCode': 1 })
  .toArray();

console.log('\n=== Recent orders (DB delivery fee charged) ===');
console.log(JSON.stringify(orders, null, 2));

await mongoose.disconnect();
