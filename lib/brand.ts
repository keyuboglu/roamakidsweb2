export const OFFICIAL_SITE_URL='https://roama.tech';
export const APP_STORE_PROVIDER_ID='129427648';
export const APP_STORE_PRODUCT_URL='https://apps.apple.com/app/apple-store/id6815158079';
export function appStoreUrl(campaign='signalquest') {
  const url=new URL(APP_STORE_PRODUCT_URL);
  url.searchParams.set('pt',APP_STORE_PROVIDER_ID);
  url.searchParams.set('ct',campaign);
  url.searchParams.set('mt','8');
  return url.toString();
}
export const OFFICIAL_IOS_STORE_URL=appStoreUrl();
// Android package from the ROAMA Kids app (expo.android.package); Google Play listing live since 17 Nov 2026.
export const GOOGLE_PLAY_URL='https://play.google.com/store/apps/details?id=com.roama.kids';
