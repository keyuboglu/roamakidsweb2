export type Language='en'|'tr';
export type Device='ios'|'android'|'desktop';

export const FAMILY_CHALLENGE_MESSAGE='Three free, screen-free family challenges for kids ages 6–12. No app, photos or sign-up needed.';
export const ANDROID_LAUNCH_AT='2026-11-06T00:00:00+03:00';

export function detectLanguage(search:string,browserLanguage:string):Language {
  const override=new URLSearchParams(search).get('lang');
  if(override==='tr'||override==='en')return override;
  return browserLanguage.toLowerCase().startsWith('tr')?'tr':'en';
}

export function detectDevice(userAgent:string,maxTouchPoints=0):Device {
  if(/android/i.test(userAgent))return 'android';
  if(/iphone|ipad|ipod/i.test(userAgent)||(/macintosh/i.test(userAgent)&&maxTouchPoints>1))return 'ios';
  return 'desktop';
}

export function daysUntilAndroidLaunch(now=Date.now()) {
  return Math.max(0,Math.ceil((new Date(ANDROID_LAUNCH_AT).getTime()-now)/86400000));
}

export function localizedPath(path:string,language:Language) {
  const [base,hash]=path.split('#');
  const [pathname,query='']=base.split('?');
  const params=new URLSearchParams(query);
  params.set('lang',language);
  return `${pathname}?${params}${hash?`#${hash}`:''}`;
}
