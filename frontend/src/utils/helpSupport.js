export const DEFAULT_HELP_SUPPORT = {
  title: 'Help & Support',
  subtitle:
    'Reach customer care or browse quick answers about orders, shipping, and payments.',
  phone: '+91 76781 54795',
  phoneHours: 'Mon–Sat, 9 AM – 6 PM',
  email: 'supportauriva77@gmail.com',
  emailNote: 'Reply within 24 hours',
  writeTitle: 'Write to us',
  writeLink: '/contact',
  writeNote: 'Orders, refunds & feedback',
  fullHelpLink: '/help-support',
  faqs: [
    {
      q: 'How do I track my order?',
      a: 'Open My Orders and tap Track, or use the tracking link from your confirmation message.'
    },
    {
      q: 'What payment methods do you accept?',
      a: 'Pay online with UPI, cards, or net banking (Razorpay), or choose Cash on Delivery where available.'
    },
    {
      q: 'Can I cancel an order?',
      a: 'You can cancel from the order tracking page while the order is still Received, Accepted, or Packed.'
    },
    {
      q: 'How do I update my delivery address?',
      a: 'Go to Saved Addresses to add, edit, or set a default address before placing your next order.'
    },
    {
      q: 'My payment succeeded but I do not see an order.',
      a: 'Wait a few minutes and refresh My Orders. If it still does not appear, email support with your payment ID.'
    }
  ]
};

/**
 * Resolve Help & Support CMS content from store settings (public or admin).
 */
export function resolveHelpSupport(settings = {}) {
  const hs = settings?.helpSupport && typeof settings.helpSupport === 'object'
    ? settings.helpSupport
    : {};

  const phone =
    String(hs.phone || settings?.supportPhone || settings?.storePhone || DEFAULT_HELP_SUPPORT.phone).trim();
  const email =
    String(hs.email || settings?.supportEmail || settings?.storeEmail || DEFAULT_HELP_SUPPORT.email)
      .trim()
      .toLowerCase();

  const faqs = Array.isArray(hs.faqs) && hs.faqs.length
    ? hs.faqs
        .map((f) => ({
          q: String(f?.q || '').trim(),
          a: String(f?.a || '').trim()
        }))
        .filter((f) => f.q && f.a)
    : DEFAULT_HELP_SUPPORT.faqs;

  return {
    title: String(hs.title || DEFAULT_HELP_SUPPORT.title).trim() || DEFAULT_HELP_SUPPORT.title,
    subtitle: String(hs.subtitle || DEFAULT_HELP_SUPPORT.subtitle).trim() || DEFAULT_HELP_SUPPORT.subtitle,
    phone,
    phoneTel: phone.replace(/[^\d+]/g, ''),
    phoneHours: String(hs.phoneHours || DEFAULT_HELP_SUPPORT.phoneHours).trim() || DEFAULT_HELP_SUPPORT.phoneHours,
    email,
    emailNote: String(hs.emailNote || DEFAULT_HELP_SUPPORT.emailNote).trim() || DEFAULT_HELP_SUPPORT.emailNote,
    writeTitle: String(hs.writeTitle || DEFAULT_HELP_SUPPORT.writeTitle).trim() || DEFAULT_HELP_SUPPORT.writeTitle,
    writeLink: String(hs.writeLink || DEFAULT_HELP_SUPPORT.writeLink).trim() || DEFAULT_HELP_SUPPORT.writeLink,
    writeNote: String(hs.writeNote || DEFAULT_HELP_SUPPORT.writeNote).trim() || DEFAULT_HELP_SUPPORT.writeNote,
    fullHelpLink: String(hs.fullHelpLink || DEFAULT_HELP_SUPPORT.fullHelpLink).trim() || DEFAULT_HELP_SUPPORT.fullHelpLink,
    faqs
  };
}
