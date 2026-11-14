'use client';

import {createContext,useContext,useEffect,useSyncExternalStore,type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import {detectDevice,detectLanguage,type Device,type Language} from '@/lib/funnel';
import {trackEvent} from '@/lib/client-analytics';
import {ANALYTICS_PAGES} from '@/lib/anonymous-analytics';

function subscribe(callback:()=>void) {
  window.addEventListener('popstate',callback);
  window.addEventListener('languagechange',callback);
  return ()=>{
    window.removeEventListener('popstate',callback);
    window.removeEventListener('languagechange',callback);
  };
}

const LanguageContext=createContext<Language>('en');

export function LanguageProvider({language,children}:{language:Language;children?:ReactNode}) {
  return <LanguageContext.Provider value={language}>{children}</LanguageContext.Provider>;
}

export function useLanguage():Language {
  const initial=useContext(LanguageContext);
  const pathname=usePathname();
  return useSyncExternalStore(subscribe,()=>{
    void pathname;
    return detectLanguage(window.location.search);
  },()=>initial);
}

export function useDevice():Device|'pending' {
  return useSyncExternalStore(subscribe,()=>detectDevice(navigator.userAgent,navigator.maxTouchPoints),()=>'pending');
}

export default function FunnelPreferences() {
  const language=useLanguage();
  const pathname=usePathname();
  useEffect(()=>{
    document.documentElement.lang=language;
    try {
      window.sessionStorage.removeItem('roama-campaign-attribution-v1');
    } catch {
      console.warn('Legacy campaign attribution could not be removed from session storage.');
    }
  },[language,pathname]);
  useEffect(()=>{
    if(ANALYTICS_PAGES.includes(pathname))trackEvent('page_view');
  },[pathname,language]);
  return null;
}
