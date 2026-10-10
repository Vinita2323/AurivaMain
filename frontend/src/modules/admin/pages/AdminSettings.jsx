import React, { useState, useEffect, useRef } from 'react';
import { Save, Check, Truck, AlertCircle } from 'lucide-react';

import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { useAdmin } from '../../../context/AdminContext';

const EMPTY_FORM = {
  storeName: '',
  supportEmail: '',
  supportPhone: '',
  freeDeliveryThreshold: 499,
  standardDeliveryFee: 40,
  codDeliveryFee: 60,
  gstRate: 5,
  hubAddress: '',
  warehouseName: '',
  warehouseAddress: '',
  warehouseCity: '',
  warehouseState: '',
  warehousePincode: '',
  warehousePhone: '',
  lowStockThreshold: 30,
  currency: '₹'
};

export default function AdminSettings() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings, updateSettings } = useAdmin();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const hydratedRef = useRef(false);

  // Hydrate once from context/API settings — do not reset while the admin is typing
  useEffect(() => {
    if (!settings || typeof settings !== 'object') return;
    if (hydratedRef.current) return;
    setFormData((prev) => ({ ...prev, ...settings }));
    hydratedRef.current = true;
  }, [settings]);

  const setField = (key, value) => {
    setSaved(false);
    setError('');
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const result = await updateSettings({
        storeName: String(formData.storeName || '').trim(),
        supportEmail: String(formData.supportEmail || '').trim(),
        supportPhone: String(formData.supportPhone || '').trim(),
        freeDeliveryThreshold: Number(formData.freeDeliveryThreshold) || 0,
        standardDeliveryFee: Number(formData.standardDeliveryFee) || 0,
        codDeliveryFee: Number(formData.codDeliveryFee) || 0,
        gstRate: Number(formData.gstRate) || 0,
        hubAddress: String(formData.hubAddress || '').trim(),
        warehouseName: String(formData.warehouseName || '').trim(),
        warehouseAddress: String(formData.warehouseAddress || '').trim(),
        warehouseCity: String(formData.warehouseCity || '').trim(),
        warehouseState: String(formData.warehouseState || '').trim(),
        warehousePincode: String(formData.warehousePincode || '').trim(),
        warehousePhone: String(formData.warehousePhone || '').trim(),
        lowStockThreshold: Number(formData.lowStockThreshold) || 0,
        currency: formData.currency || '₹'
      });
      if (result?.settings) {
        setFormData((prev) => ({ ...prev, ...result.settings }));
      }
      hydratedRef.current = true;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err?.message || 'Could not save store settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 bg-white text-[#0E2A1B] focus:outline-none focus:border-[#0E2A1B] focus:ring-1 focus:ring-[#0E2A1B]/20 disabled:opacity-60';

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Store Settings & Rules" />

        <main className="p-4 sm:p-8 space-y-6 max-w-4xl">
          <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D5] shadow-xs space-y-6">
            <div className="border-b border-stone-200 pb-4">
              <h2 className="font-serif text-xl font-bold text-[#0E2A1B]">General Store & Delivery Configuration</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Edit delivery thresholds, GST, warehouse details, and support contacts — then save.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="storeName">
                    Store Brand Entity Name
                  </label>
                  <input
                    id="storeName"
                    name="storeName"
                    type="text"
                    autoComplete="organization"
                    value={formData.storeName || ''}
                    onChange={(e) => setField('storeName', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="supportEmail">
                    Customer Support Email
                  </label>
                  <input
                    id="supportEmail"
                    name="supportEmail"
                    type="email"
                    autoComplete="email"
                    value={formData.supportEmail || ''}
                    onChange={(e) => setField('supportEmail', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5]">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1" htmlFor="freeDeliveryThreshold">
                    Free Delivery Minimum (₹)
                  </label>
                  <input
                    id="freeDeliveryThreshold"
                    name="freeDeliveryThreshold"
                    type="number"
                    min={0}
                    step={1}
                    value={formData.freeDeliveryThreshold ?? 499}
                    onChange={(e) => setField('freeDeliveryThreshold', e.target.value === '' ? '' : Number(e.target.value))}
                    className={inputClass}
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">Waives shipping above this cart value</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1" htmlFor="standardDeliveryFee">
                    Prepaid Delivery Fee (₹)
                  </label>
                  <input
                    id="standardDeliveryFee"
                    name="standardDeliveryFee"
                    type="number"
                    min={0}
                    step={1}
                    value={formData.standardDeliveryFee ?? 40}
                    onChange={(e) => setField('standardDeliveryFee', e.target.value === '' ? '' : Number(e.target.value))}
                    className={inputClass}
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">Used when live Shiprocket rates are off</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1" htmlFor="codDeliveryFee">
                    COD Delivery Fee (₹)
                  </label>
                  <input
                    id="codDeliveryFee"
                    name="codDeliveryFee"
                    type="number"
                    min={0}
                    step={1}
                    value={formData.codDeliveryFee ?? 60}
                    onChange={(e) => setField('codDeliveryFee', e.target.value === '' ? '' : Number(e.target.value))}
                    className={inputClass}
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">Cash on delivery shipping fee</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1" htmlFor="gstRate">
                    GST Tax Rate (%)
                  </label>
                  <input
                    id="gstRate"
                    name="gstRate"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={formData.gstRate ?? 5}
                    onChange={(e) => setField('gstRate', e.target.value === '' ? '' : Number(e.target.value))}
                    className={inputClass}
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">Calculated in cart breakdown</span>
                </div>
              </div>

              <p className="text-[11px] text-stone-500 flex items-start gap-2 p-3 rounded-xl bg-white border border-stone-200">
                <Truck className="w-4 h-4 text-[#C89038] shrink-0 mt-0.5" />
                <span>
                  When Shiprocket checkout quotes are enabled, courier rates come from Shiprocket.
                  Otherwise prepaid / COD fees above are used at checkout.
                </span>
              </p>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="hubAddress">
                  Central Warehouse Logistics Hub Address
                </label>
                <textarea
                  id="hubAddress"
                  name="hubAddress"
                  rows={2}
                  value={formData.hubAddress || ''}
                  onChange={(e) => setField('hubAddress', e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="warehouseCity">
                    Warehouse City
                  </label>
                  <input
                    id="warehouseCity"
                    name="warehouseCity"
                    type="text"
                    value={formData.warehouseCity || ''}
                    onChange={(e) => setField('warehouseCity', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="warehousePincode">
                    Warehouse Pincode
                  </label>
                  <input
                    id="warehousePincode"
                    name="warehousePincode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={formData.warehousePincode || ''}
                    onChange={(e) => setField('warehousePincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="lowStockThreshold">
                  Low Inventory Alert Threshold (Units)
                </label>
                <input
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  type="number"
                  min={0}
                  step={1}
                  value={formData.lowStockThreshold ?? 30}
                  onChange={(e) => setField('lowStockThreshold', e.target.value === '' ? '' : Number(e.target.value))}
                  className={`${inputClass} w-48`}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-stone-500">
                {saved
                  ? 'Store settings synchronized successfully!'
                  : 'Edit any field above, then click Save Store Rules'}
              </span>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[#0E2A1B] text-white hover:bg-[#1B3B29] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-60"
              >
                {saved ? <Check className="w-4 h-4 text-[#D4AF37]" /> : <Save className="w-4 h-4 text-[#D4AF37]" />}
                <span>{saving ? 'Saving…' : saved ? 'Configurations Saved' : 'Save Store Rules'}</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
