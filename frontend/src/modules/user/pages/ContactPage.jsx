import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Leaf, Clock, LifeBuoy, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AnnouncementBar from '../components/AnnouncementBar';
import { useAdmin } from '../../../context/AdminContext';
import { resolveHelpSupport } from '../../../utils/helpSupport';

const INSTAGRAM_URL = 'https://www.instagram.com/aurivabites.in';
const INSTAGRAM_HANDLE = '@aurivabites.in';

export default function ContactPage() {
  const { settings } = useAdmin();
  const help = resolveHelpSupport(settings);
  const officeAddress =
    settings?.storeAddress ||
    settings?.hubAddress ||
    'House no. 1213, Sector 15, Sonipat, Haryana - 131001';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans text-[#182019]">
      <AnnouncementBar />
      <Header />

      <main className="pb-28 md:pb-14">
        <div className="bg-[#0E2A1B] text-[#F7F3E9] py-8 sm:py-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-6 left-8 w-40 h-40 bg-[#D4AF37] rounded-full blur-[80px]" />
            <div className="absolute bottom-4 right-8 w-40 h-40 bg-[#143B24] rounded-full blur-[80px]" />
          </div>
          <div className="relative z-10 max-w-2xl mx-auto px-4">
            <div className="inline-flex items-center justify-center gap-2 mb-2">
              <Leaf className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-[#D4AF37] font-bold tracking-[0.18em] uppercase text-[10px] sm:text-xs">
                Get in Touch
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold mb-2">Contact Us</h1>
            <p className="text-xs sm:text-sm text-[#A2B5A8] leading-relaxed">
              {help.subtitle}
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-4 sm:-mt-5 relative z-20 space-y-3">
          <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-sm p-4 sm:p-5">
            <h2 className="font-serif text-lg font-bold text-[#0E2A1B] mb-3">Contact Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={`tel:${help.phoneTel}`}
                className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] hover:border-[#0E2A1B]/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[#0E2A1B] text-[#D4AF37] flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Phone</p>
                  <p className="text-sm font-bold text-[#0E2A1B] truncate">{help.phone}</p>
                  <p className="text-[10px] text-stone-500 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {help.phoneHours}
                  </p>
                </div>
              </a>

              <a
                href={`mailto:${help.email}`}
                className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] hover:border-[#0E2A1B]/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[#0E2A1B] text-[#D4AF37] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Email</p>
                  <p className="text-sm font-bold text-[#0E2A1B] break-all">{help.email}</p>
                  <p className="text-[10px] text-stone-500 mt-0.5">{help.emailNote}</p>
                </div>
              </a>

              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] hover:border-[#0E2A1B]/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[#0E2A1B] text-[#D4AF37] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Instagram</p>
                  <p className="text-sm font-bold text-[#0E2A1B]">{INSTAGRAM_HANDLE}</p>
                  <p className="text-[10px] text-stone-500 mt-0.5">Recipes, tips & offers</p>
                </div>
              </a>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5]">
                <div className="w-9 h-9 rounded-full bg-[#0E2A1B] text-[#D4AF37] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Office</p>
                  <p className="text-sm font-bold text-[#0E2A1B] leading-snug">{officeAddress}</p>
                </div>
              </div>
            </div>
          </div>

          <Link
            to={help.fullHelpLink.startsWith('/') ? help.fullHelpLink : '/help-support'}
            className="flex items-center justify-between gap-3 w-full p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E8E2D5] shadow-sm hover:border-[#0E2A1B]/30 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#0E2A1B] text-[#D4AF37] flex items-center justify-center shrink-0">
                <LifeBuoy className="w-4 h-4" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-sm font-bold text-[#0E2A1B]">Help & Support</p>
                <p className="text-[10px] text-stone-500 mt-0.5">Order help, FAQs & more</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#C89038] shrink-0" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
