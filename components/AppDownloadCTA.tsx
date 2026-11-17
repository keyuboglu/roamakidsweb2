'use client';

import Image from 'next/image';
import {useDevice,useLanguage} from '@/components/FunnelPreferences';
import {GOOGLE_PLAY_URL,OFFICIAL_IOS_STORE_URL} from '@/lib/brand';
import type {Attribution} from '@/lib/attribution';
import {trackStoreClick} from '@/lib/client-analytics';

// Official, unmodified Google Play badge (transparent margin trimmed only), localized, linked to the
// Play listing, at least as tall as the App Store button, with the required trademark notice.
const BADGE={en:{src:'/badges/google-play-badge-en.png',w:564,h:168,alt:'Get it on Google Play'},tr:{src:'/badges/google-play-badge-tr.png',w:646,h:192,alt:'Google Play’den indirin'}};

export default function AppDownloadCTA({slug,attribution,compact=false}:{slug?:string;attribution?:Attribution;compact?:boolean;completion?:boolean}) {
  const language=useLanguage();
  const tr=language==='tr';
  const device=useDevice();
  const badge=BADGE[tr?'tr':'en'];
  if(compact)return device==='android'
    ?<a className="nav-cta nav-cta-store" href={GOOGLE_PLAY_URL} target="_blank" rel="noreferrer" onClick={()=>trackStoreClick('android',slug,attribution)}>Google Play ↗</a>
    :<a className="nav-cta nav-cta-store" href={OFFICIAL_IOS_STORE_URL} target="_blank" rel="noreferrer" onClick={()=>trackStoreClick('ios',slug,attribution)}>App Store ↗</a>;
  return <div className={`app-download-options app-download-${device}`}>
    {device!=='android'&&<a className="button button-gold app-store-button" href={OFFICIAL_IOS_STORE_URL} target="_blank" rel="noreferrer" onClick={()=>trackStoreClick('ios',slug,attribution)}>{tr?'Maceraya App Store’da Devam Et':'Continue the Adventure on the App Store'} ↗</a>}
    {device!=='ios'&&<div className="google-play-option">
      <a className="google-play-badge" href={GOOGLE_PLAY_URL} target="_blank" rel="noreferrer" data-google-play onClick={()=>trackStoreClick('android',slug,attribution)}>
        <Image src={badge.src} alt={badge.alt} width={Math.round(badge.w/badge.h*56)} height={56} unoptimized/>
      </a>
      <small className="google-play-trademark">{tr?'Google Play ve Google Play logosu, Google LLC’nin ticari markalarıdır.':'Google Play and the Google Play logo are trademarks of Google LLC.'}</small>
    </div>}
  </div>;
}
