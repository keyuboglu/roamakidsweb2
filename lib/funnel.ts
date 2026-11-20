export type Language='en'|'tr';
export type Device='ios'|'android'|'desktop';

export const FAMILY_CHALLENGE_MESSAGE='Three free no-app family challenges for kids ages 6–12. No photos or sign-up needed.';

export function detectLanguage(search:string):Language {
  const override=new URLSearchParams(search).get('lang');
  if(override==='tr'||override==='en')return override;
  return 'en';
}

export function detectDevice(userAgent:string,maxTouchPoints=0):Device {
  if(/android/i.test(userAgent))return 'android';
  if(/iphone|ipad|ipod/i.test(userAgent)||(/macintosh/i.test(userAgent)&&maxTouchPoints>1))return 'ios';
  return 'desktop';
}

export function localizedPath(path:string,language:Language) {
  const [base,hash]=path.split('#');
  const [pathname,query='']=base.split('?');
  const params=new URLSearchParams(query);
  params.set('lang',language);
  return `${pathname}?${params}${hash?`#${hash}`:''}`;
}
