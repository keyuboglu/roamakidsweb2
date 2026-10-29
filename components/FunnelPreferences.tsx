'use client';

import {useEffect,useSyncExternalStore} from 'react';
import {usePathname} from 'next/navigation';
import {currentAttribution} from '@/lib/attribution';
import {detectDevice,detectLanguage,type Device,type Language} from '@/lib/funnel';

function subscribe(callback:()=>void) {
  window.addEventListener('popstate',callback);
  window.addEventListener('languagechange',callback);
  return ()=>{
    window.removeEventListener('popstate',callback);
    window.removeEventListener('languagechange',callback);
  };
}

export function useLanguage():Language {
  const pathname=usePathname();
  return useSyncExternalStore(subscribe,()=>{
    void pathname;
    return detectLanguage(window.location.search,navigator.language);
  },()=>'en');
}

export function useDevice():Device|'pending' {
  return useSyncExternalStore(subscribe,()=>detectDevice(navigator.userAgent,navigator.maxTouchPoints),()=>'pending');
}

export default function FunnelPreferences() {
  const language=useLanguage();
  const pathname=usePathname();
  useEffect(()=>{
    document.documentElement.lang=language;
    currentAttribution();
  },[language,pathname]);
  return null;
}
