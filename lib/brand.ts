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
