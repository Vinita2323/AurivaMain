import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Shield, Lock, Eye, Database, Mail, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AnnouncementBar from '../components/AnnouncementBar';

const sections = [
  {
    id: 'intro',
    title: '1. Introduction',
    body: [
      'AURIVÁ Foods Private Limited (“AURIVÁ”, “we”, “us”, or “our”) respects your privacy and is committed to protecting the personal information you share with us when you browse aurivabites.in, place orders, or contact our support team.',
      'This Privacy Policy explains what data we collect, how we use it, and the choices available to you. By using our website or app, you agree to the practices described here.'
    ]
  },
  {
    id: 'collect',
    title: '2. Information We Collect',
    body: [
      'Account & contact details: name, phone number, email address, and delivery addresses you save.',
      'Order information: products purchased, payment method type (e.g. COD or online), order value, and shipping details.',
      'Technical data: device type, browser, IP address (approximate), and pages visited, used to keep the store secure and improve performance.',
      'Support messages: any information you send us via contact forms, WhatsApp, email, or phone.'
    ]
  },
  {
    id: 'use',
    title: '3. How We Use Your Information',
    body: [
      'To process, pack, and deliver your orders, and to send order status updates.',
      'To verify login via OTP and keep your account secure.',
      'To provide customer support, refunds, and returns assistance.',
      'To improve our products, website experience, and shipping reliability.',
      'To send important service messages. Marketing messages are sent only where permitted and you can opt out anytime.'
    ]
  },
  {
    id: 'sharing',
    title: '4. Sharing With Trusted Partners',
    body: [
      'We do not sell your personal data.',
      'We may share limited information with trusted service providers only as needed to run the store—for example payment gateways (such as Razorpay), logistics partners (such as Shiprocket / courier companies), SMS/OTP providers, and cloud hosting.',
      'These partners are required to use your data only for the services they provide to AURIVÁ and to protect it appropriately.'
    ]
  },
  {
    id: 'payments',
    title: '5. Payments',
    body: [
      'Online payments are processed by secure third-party payment providers. We do not store your full card number, UPI PIN, or banking passwords on our servers.',
      'For COD orders we only store the payment method and delivery details needed to complete the shipment.'
    ]
  },
  {
    id: 'retention',
    title: '6. Data Retention & Security',
    body: [
      'We retain order and account records as long as needed for legal, tax, dispute, and customer-service purposes.',
      'We use reasonable technical and organisational measures to protect your information. No method of transmission over the internet is 100% secure, but we work continuously to reduce risk.'
    ]
  },
  {
    id: 'rights',
    title: '7. Your Rights',
    body: [
      'You may request access to, correction of, or deletion of your personal data (subject to legal retention needs) by contacting us.',
      'You may update saved addresses and profile details from your Account after login.',
      'You may ask us to stop promotional communication at any time.'
    ]
  },
  {
    id: 'cookies',
    title: '8. Cookies & Local Storage',
    body: [
      'We use cookies and local browser storage for login sessions, cart contents, and basic site preferences so checkout works smoothly.',
      'You can clear cookies/storage in your browser settings; some features (like staying logged in or keeping a cart) may then reset.'
    ]
  },
  {
    id: 'children',
    title: '9. Children’s Privacy',
    body: [
      'Our store is intended for adults who can place orders. We do not knowingly collect personal information from children under 13. If you believe a child has provided us data, please contact us so we can delete it.'
    ]
  },
  {
    id: 'changes',
    title: '10. Updates to This Policy',
    body: [
      'We may update this Privacy Policy from time to time. The “Last updated” date at the top of this page will change when we do. Continued use of the site after updates means you accept the revised policy.'
    ]
  },
  {
    id: 'contact',
    title: '11. Contact Us',
    body: [
      'For privacy requests or questions, reach our support team:',
      'Email: care@aurivafoods.com',
      'Phone: +91 98765 43210',
      'You can also visit our Help & Support page for FAQs and order help.'
    ]
  }
];

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
              <Shield className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-[#D4AF37] font-bold tracking-[0.2em] uppercase text-xs sm:text-sm">
                Legal
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-sm sm:text-base text-[#A2B5A8] max-w-2xl mx-auto leading-relaxed">
              How AURIVÁ collects, uses, and protects your information. This page is public — no login required.
            </p>
            <p className="text-[11px] text-[#D4AF37]/90 mt-4 font-medium">Last updated: 1 October 2026</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-8 relative z-20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { icon: Lock, label: 'Secure checkout' },
              { icon: Eye, label: 'Transparent use' },
              { icon: Database, label: 'No data selling' },
              { icon: Mail, label: 'Easy contact' }
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-[#E8E2D5] p-3 sm:p-4 flex flex-col items-center text-center gap-2 shadow-sm"
              >
                <Icon className="w-5 h-5 text-[#C89038]" />
                <span className="text-[10px] sm:text-xs font-bold text-[#0E2A1B]">{label}</span>
              </div>
            ))}
          </div>

          <article className="bg-white rounded-3xl border border-[#E8E2D5] shadow-sm p-6 sm:p-10 space-y-8">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="font-serif text-lg sm:text-xl font-bold text-[#0E2A1B] mb-3">
                  {section.title}
                </h2>
                <div className="space-y-3 text-sm text-[#3A4B41] leading-relaxed">
                  {section.body.map((para) => (
                    <p key={para.slice(0, 40)}>{para}</p>
                  ))}
                </div>
              </section>
            ))}

            <div className="pt-6 border-t border-stone-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <p className="text-xs text-stone-500 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-[#C89038]" />
                Need order help instead?
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/help-support"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold uppercase tracking-wider"
                >
                  Help & Support <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#0E2A1B] text-[#0E2A1B] text-xs font-bold uppercase tracking-wider"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
