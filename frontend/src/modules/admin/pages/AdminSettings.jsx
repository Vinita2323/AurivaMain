import React, { useState, useEffect, useRef } from 'react';
import { Save, Check, Truck, AlertCircle, Plus, Trash2, LifeBuoy } from 'lucide-react';

import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { useAdmin } from '../../../context/AdminContext';
import { DEFAULT_HELP_SUPPORT } from '../../../utils/helpSupport';

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
  currency: '₹',
  helpSupport: { ...DEFAULT_HELP_SUPPORT, faqs: [...DEFAULT_HELP_SUPPORT.faqs] }
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
    const hs = settings.helpSupport && typeof settings.helpSupport === 'object'
      ? {
          ...DEFAULT_HELP_SUPPORT,
          ...settings.helpSupport,
          faqs: Array.isArray(settings.helpSupport.faqs) && settings.helpSupport.faqs.length
            ? settings.helpSupport.faqs.map((f) => ({ q: f.q || '', a: f.a || '' }))
            : [...DEFAULT_HELP_SUPPORT.faqs]
        }
      : { ...DEFAULT_HELP_SUPPORT, faqs: [...DEFAULT_HELP_SUPPORT.faqs] };

    // Prefer dedicated helpSupport contacts; fall back to store support fields
    if (!hs.phone) hs.phone = settings.supportPhone || settings.storePhone || DEFAULT_HELP_SUPPORT.phone;
    if (!hs.email) hs.email = settings.supportEmail || settings.storeEmail || DEFAULT_HELP_SUPPORT.email;

    setFormData((prev) => ({ ...prev, ...settings, helpSupport: hs }));
    hydratedRef.current = true;
  }, [settings]);

  const setField = (key, value) => {
    setSaved(false);
    setError('');
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const setHelpField = (key, value) => {
    setSaved(false);
    setError('');
    setFormData((prev) => ({
      ...prev,
      helpSupport: { ...(prev.helpSupport || DEFAULT_HELP_SUPPORT), [key]: value }
    }));
  };

  const setFaqField = (index, key, value) => {
    setSaved(false);
    setError('');
    setFormData((prev) => {
      const faqs = [...(prev.helpSupport?.faqs || [])];
      faqs[index] = { ...(faqs[index] || { q: '', a: '' }), [key]: value };
      return { ...prev, helpSupport: { ...(prev.helpSupport || DEFAULT_HELP_SUPPORT), faqs } };
    });
  };

  const addFaq = () => {
    setSaved(false);
    setFormData((prev) => {
      const faqs = [...(prev.helpSupport?.faqs || [])];
      if (faqs.length >= 20) return prev;
      faqs.push({ q: '', a: '' });
      return { ...prev, helpSupport: { ...(prev.helpSupport || DEFAULT_HELP_SUPPORT), faqs } };
    });
  };

  const removeFaq = (index) => {
    setSaved(false);
    setFormData((prev) => {
      const faqs = (prev.helpSupport?.faqs || []).filter((_, i) => i !== index);
      return { ...prev, helpSupport: { ...(prev.helpSupport || DEFAULT_HELP_SUPPORT), faqs } };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const hs = formData.helpSupport || DEFAULT_HELP_SUPPORT;
      const helpSupport = {
        title: String(hs.title || '').trim(),
        subtitle: String(hs.subtitle || '').trim(),
        phone: String(hs.phone || '').trim(),
        phoneHours: String(hs.phoneHours || '').trim(),
        email: String(hs.email || '').trim(),
        emailNote: String(hs.emailNote || '').trim(),
        writeTitle: String(hs.writeTitle || '').trim(),
        writeLink: String(hs.writeLink || '').trim(),
        writeNote: String(hs.writeNote || '').trim(),
        fullHelpLink: String(hs.fullHelpLink || '').trim(),
        faqs: (Array.isArray(hs.faqs) ? hs.faqs : [])
          .map((f) => ({ q: String(f?.q || '').trim(), a: String(f?.a || '').trim() }))
          .filter((f) => f.q && f.a)
          .slice(0, 20)
      };

      const result = await updateSettings({
        storeName: String(formData.storeName || '').trim(),
        supportEmail: helpSupport.email || String(formData.supportEmail || '').trim(),
        supportPhone: helpSupport.phone || String(formData.supportPhone || '').trim(),
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
        currency: formData.currency || '₹',
        helpSupport
      });
      if (result?.settings) {
        const nextHs = result.settings.helpSupport || helpSupport;
        setFormData((prev) => ({
          ...prev,
          ...result.settings,
          helpSupport: {
            ...DEFAULT_HELP_SUPPORT,
            ...nextHs,
            faqs: Array.isArray(nextHs.faqs) ? nextHs.faqs : helpSupport.faqs
          }
        }));
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

  const hs = formData.helpSupport || DEFAULT_HELP_SUPPORT;

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

            {/* Help & Support CMS */}
            <div className="border-t border-stone-200 pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0E2A1B] text-[#D4AF37] flex items-center justify-center shrink-0">
                  <LifeBuoy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#0E2A1B]">Help & Support Page</h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Controls Account → Help & Support and the public /help-support page (contacts, copy, FAQs).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="hsTitle">
                    Page Title
                  </label>
                  <input
                    id="hsTitle"
                    type="text"
                    value={hs.title || ''}
                    onChange={(e) => setHelpField('title', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="hsFullLink">
                    Full Help Centre Path
                  </label>
                  <input
                    id="hsFullLink"
                    type="text"
                    value={hs.fullHelpLink || ''}
                    onChange={(e) => setHelpField('fullHelpLink', e.target.value)}
                    className={inputClass}
                    placeholder="/help-support"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="hsSubtitle">
                  Intro / Subtitle
                </label>
                <textarea
                  id="hsSubtitle"
                  rows={2}
                  value={hs.subtitle || ''}
                  onChange={(e) => setHelpField('subtitle', e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5]">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1" htmlFor="hsPhone">
                    Call Us — Phone
                  </label>
                  <input
                    id="hsPhone"
                    type="text"
                    value={hs.phone || ''}
                    onChange={(e) => setHelpField('phone', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1" htmlFor="hsPhoneHours">
                    Call Us — Hours
                  </label>
                  <input
                    id="hsPhoneHours"
                    type="text"
                    value={hs.phoneHours || ''}
                    onChange={(e) => setHelpField('phoneHours', e.target.value)}
                    className={inputClass}
                    placeholder="Mon–Sat, 9 AM – 6 PM"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1" htmlFor="hsEmail">
                    Email Address
                  </label>
                  <input
                    id="hsEmail"
                    type="email"
                    value={hs.email || ''}
                    onChange={(e) => setHelpField('email', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1" htmlFor="hsEmailNote">
                    Email Response Note
                  </label>
                  <input
                    id="hsEmailNote"
                    type="text"
                    value={hs.emailNote || ''}
                    onChange={(e) => setHelpField('emailNote', e.target.value)}
                    className={inputClass}
                    placeholder="Reply within 24 hours"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="hsWriteTitle">
                    Write-to-us Title
                  </label>
                  <input
                    id="hsWriteTitle"
                    type="text"
                    value={hs.writeTitle || ''}
                    onChange={(e) => setHelpField('writeTitle', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="hsWriteLink">
                    Contact Form Path / URL
                  </label>
                  <input
                    id="hsWriteLink"
                    type="text"
                    value={hs.writeLink || ''}
                    onChange={(e) => setHelpField('writeLink', e.target.value)}
                    className={inputClass}
                    placeholder="/contact"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="hsWriteNote">
                    Write-to-us Note
                  </label>
                  <input
                    id="hsWriteNote"
                    type="text"
                    value={hs.writeNote || ''}
                    onChange={(e) => setHelpField('writeNote', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">FAQs</h4>
                  <button
                    type="button"
                    onClick={addFaq}
                    disabled={(hs.faqs || []).length >= 20}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0E2A1B]/20 text-[11px] font-bold text-[#0E2A1B] hover:bg-[#FAF7F2] disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add FAQ
                  </button>
                </div>
                {(hs.faqs || []).map((faq, idx) => (
                  <div
                    key={`faq-${idx}`}
                    className="p-3.5 rounded-2xl border border-stone-200 bg-white space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        FAQ {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFaq(idx)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                        aria-label={`Remove FAQ ${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={faq.q || ''}
                      onChange={(e) => setFaqField(idx, 'q', e.target.value)}
                      className={inputClass}
                      placeholder="Question"
                    />
                    <textarea
                      rows={2}
                      value={faq.a || ''}
                      onChange={(e) => setFaqField(idx, 'a', e.target.value)}
                      className={inputClass}
                      placeholder="Answer"
                    />
                  </div>
                ))}
                {!(hs.faqs || []).length && (
                  <p className="text-xs text-stone-500">No FAQs yet — add at least one for the help pages.</p>
                )}
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
