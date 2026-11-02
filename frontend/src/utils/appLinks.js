/** Store listing for the AURIVÁ mobile app (used by the Share App option). */
export const APP_STORE_LINKS = {
  android: 'https://play.google.com/store/apps/details?id=com.auriva.user'
};

export const APP_SHARE_TITLE = 'AURIVÁ — Premium Roasted Makhana';

/** Message people receive when the app is shared. */
export function buildShareText() {
  return [
    'Try the AURIVÁ app — premium roasted makhana & healthy snacks, delivered fresh! 🌿',
    '',
    `Get it on Google Play: ${APP_STORE_LINKS.android}`
  ].join('\n');
}
