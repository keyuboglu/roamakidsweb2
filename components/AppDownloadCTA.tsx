'use client';

import {useDevice,useLanguage} from '@/components/FunnelPreferences';
import {OFFICIAL_IOS_STORE_URL} from '@/lib/brand';
import type {Attribution} from '@/lib/attribution';
import {trackStoreClick} from '@/lib/client-analytics';

export default function AppDownloadCTA({slug,attribution,compact=false}:{slug?:string;attribution?:Attribution;compact?:boolean;completion?:boolean}) {
  const tr=useLanguage()==='tr';
  const device=useDevice();
  if(compact)return <a className="nav-cta nav-cta-store" href={OFFICIAL_IOS_STORE_URL} target="_blank" rel="noreferrer" onClick={()=>trackStoreClick('ios',slug,attribution)}>App Store ↗</a>;
  return <div className={`app-download-options app-download-${device}`}>
    {device!=='android'&&<a className="button button-gold app-store-button" href={OFFICIAL_IOS_STORE_URL} target="_blank" rel="noreferrer" onClick={()=>trackStoreClick('ios',slug,attribution)}>{tr?'Maceraya App Store’da Devam Et':'Continue the Adventure on the App Store'} ↗</a>}
    <p>{tr?'Google Play’de çok yakında':'Coming soon to Google Play'}</p>
  </div>;
}
