import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Leaf,
  LifeBuoy,
  Package,
  Truck,
  RefreshCcw,
  CreditCard,
  Phone,
  Mail,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  MapPin
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AnnouncementBar from '../components/AnnouncementBar';

const faqs = [
  {
    q: 'Do I need an account to place an order?',
    a: 'You can browse freely without login. To place an order you need to verify your mobile number with OTP so we can save your address and send delivery updates.'
  },
  {
    q: 'How do I track my order?',
    a: 'Go to Account → Orders, or open the order tracking link from your confirmation message. Tracking updates appear as the courier picks up and moves your shipment.'
  },
  {
    q: 'What payment methods do you accept?',
    a: 'You can pay online (UPI, cards, net banking via Razorpay) or choose Cash on Delivery where available. For online payments, your Auriva order is created only after payment succeeds.'
  },
  {
    q: 'How is shipping calculated?',
    a: 'Delivery charges are based on live courier rates for your pincode and payment type (prepaid vs COD). Orders above the free-delivery threshold shown at checkout ship free.'
  },
  {
    q: 'How long does delivery take?',
    a: 'Most metro and major city pincodes receive orders in about 2–7 days depending on the courier. Exact estimates appear at checkout once your address pincode is selected.'
  },
  {
    q: 'Can I cancel or return an order?',
    a: 'You can request cancellation from your order page while the order is still being processed / packed. For returns or damaged items, contact support with your order number and photos within 48 hours of delivery.'
  },
  {
    q: 'My payment succeeded but I do not see an order.',
    a: 'Rarely, network issues delay confirmation. Wait a few minutes and refresh My Orders. If it still does not appear, email care@aurivafoods.com with your Razorpay payment ID — we will resolve it priority.'
  },
  {
    q: 'How do I update my delivery address?',
    a: 'After login, open Account → Addresses to add, edit, or set a default address before checkout.'
  }
];

const topics = [
  {
    icon: Package,
    title: 'Orders & packing',
    desc: 'Status, invoices, and item questions',
    href: '#faqs'
  },
  {
    icon: Truck,
    title: 'Shipping',
    desc: 'Pincodes, fees, and delivery timelines',
    href: '#shipping'
  },
  {
    icon: RefreshCcw,
    title: 'Returns & refunds',
    desc: 'Damaged parcels and cancellation help',
    href: '#returns'
  },
  {
    icon: CreditCard,
    title: 'Payments',
    desc: 'Online pay, COD, and failed payments',
    href: '#faqs'
  }
];

export default function HelpSupportPage() {
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const hash = window.location.hash?.replace('#', '');
    if (!hash) return;
    const timer = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans text-[#182019]">
      <AnnouncementBar />
      <Header />

      <main className="pb-16 sm:pb-24">
        <div className="bg-[#0E2A1B] text-[#F7F3E9] py-14 sm:py-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-64 h-64 bg-[#D4AF37] rounded-full blur-[100px]" />
            <div className="absolute bottom-10 right-10 w-64 h-64 bg-[#143B24] rounded-full blur-[100px]" />
          </div>
          <div className="relative z-10 max-w-3xl mx-auto px-4">
            <div className="inline-flex items-center justify-center gap-2 mb-4">
              <LifeBuoy className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-[#D4AF37] font-bold tracking-[0.2em] uppercase text-xs sm:text-sm">
                Customer Care
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold mb-4">Help & Support</h1>
            <p className="text-sm sm:text-base text-[#A2B5A8] max-w-2xl mx-auto leading-relaxed">
              FAQs, shipping help, and ways to reach us — available publicly, even if you are not logged in.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-8 relative z-20 space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {topics.map(({ icon: Icon, title, desc, href }) => (
              <a
                key={title}
                href={href}
                className="bg-white rounded-2xl border border-[#E8E2D5] p-4 sm:p-5 shadow-sm hover:border-[#C89038]/50 hover:shadow-md transition-all text-left"
              >
                <Icon className="w-5 h-5 text-[#C89038] mb-3" />
                <h3 className="text-xs sm:text-sm font-bold text-[#0E2A1B] mb-1">{title}</h3>
                <p className="text-[10px] sm:text-xs text-stone-500 leading-relaxed">{desc}</p>
              </a>
            ))}
          </div>

          {/* Contact strip */}
          <div className="bg-white rounded-3xl border border-[#E8E2D5] shadow-sm p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-[#F7F3E9] border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-[#C89038]" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Call us</h3>
                <a href="tel:+919876543210" className="text-sm font-bold text-[#0E2A1B] hover:text-[#C89038]">
                  +91 98765 43210
                </a>
                <p className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Mon–Sat, 9 AM – 6 PM IST
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-[#F7F3E9] border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-[#C89038]" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Email</h3>
                <a
                  href="mailto:care@aurivafoods.com"
                  className="text-sm font-bold text-[#0E2A1B] hover:text-[#C89038] break-all"
                >
                  care@aurivafoods.com
                </a>
                <p className="text-[11px] text-stone-500 mt-1">We reply within 24 hours</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-[#F7F3E9] border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-[#C89038]" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Write to us</h3>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1 text-sm font-bold text-[#0E2A1B] hover:text-[#C89038]"
                >
                  Contact form <ChevronRight className="w-4 h-4" />
                </Link>
                <p className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Based in Indore / Sonipat hub
                </p>
              </div>
            </div>
          </div>

          {/* FAQs */}
          <section id="faqs" className="bg-white rounded-3xl border border-[#E8E2D5] shadow-sm p-6 sm:p-8 scroll-mt-24">
            <div className="flex items-center gap-2 mb-6">
              <Leaf className="w-5 h-5 text-[#C89038]" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0E2A1B]">Frequently asked questions</h2>
            </div>
            <div className="space-y-2">
              {faqs.map((item, idx) => {
                const open = openFaq === idx;
                return (
                  <div
                    key={item.q}
                    className={`rounded-2xl border transition-colors ${
                      open ? 'border-[#0E2A1B]/30 bg-[#FAF7F2]' : 'border-stone-200 bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? -1 : idx)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
                      aria-expanded={open}
                    >
                      <span className="text-sm font-bold text-[#0E2A1B]">{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#C89038] shrink-0 transition-transform ${
                          open ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {open && (
                      <p className="px-4 pb-4 text-sm text-[#3A4B41] leading-relaxed border-t border-stone-100/80 pt-3">
                        {item.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <section
              id="shipping"
              className="bg-white rounded-3xl border border-[#E8E2D5] shadow-sm p-6 sm:p-8 scroll-mt-24"
            >
              <Truck className="w-6 h-6 text-[#C89038] mb-3" />
              <h2 className="font-serif text-xl font-bold text-[#0E2A1B] mb-3">Shipping & delivery</h2>
              <ul className="space-y-2 text-sm text-[#3A4B41] leading-relaxed list-disc pl-4">
                <li>We ship across serviceable India pincodes via partner couriers.</li>
                <li>Rates at checkout use live logistics estimates for your pin + payment type.</li>
                <li>You receive tracking once the shipment is handed to the courier.</li>
                <li>Please keep your phone reachable for delivery attempts.</li>
              </ul>
            </section>

            <section
              id="returns"
              className="bg-white rounded-3xl border border-[#E8E2D5] shadow-sm p-6 sm:p-8 scroll-mt-24"
            >
              <RefreshCcw className="w-6 h-6 text-[#C89038] mb-3" />
              <h2 className="font-serif text-xl font-bold text-[#0E2A1B] mb-3">Returns & refunds</h2>
              <ul className="space-y-2 text-sm text-[#3A4B41] leading-relaxed list-disc pl-4">
                <li>Report damaged or wrong items within 48 hours of delivery with photos.</li>
                <li>Eligible refunds for prepaid orders are processed to the original payment method.</li>
                <li>COD refunds (where approved) are arranged by our support team.</li>
                <li>Opened food packs may not be returnable for hygiene reasons unless damaged on arrival.</li>
              </ul>
            </section>
          </div>

          <div className="rounded-3xl bg-[#0E2A1B] text-[#F7F3E9] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl font-bold mb-1">Still need help?</h3>
              <p className="text-sm text-[#A2B5A8]">
                Share your order number for faster support. Privacy details are on our public policy page.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#D4AF37] text-[#0E2A1B] text-xs font-extrabold uppercase tracking-wider"
              >
                Contact us
              </Link>
              <Link
                to="/privacy-policy"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-extrabold uppercase tracking-wider"
              >
                Privacy policy
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
