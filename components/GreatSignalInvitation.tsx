'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useLanguage} from '@/components/FunnelPreferences';
import {localizedPath} from '@/lib/funnel';
import {isGreatSignalDate} from '@/lib/great-signal';

export default function GreatSignalInvitation() {
  const language=useLanguage();
  const [active,setActive]=useState(false);
  useEffect(()=>{
    const update=()=>setActive(isGreatSignalDate(new Date()));
    update();
    const timer=window.setInterval(update,60000);
    return ()=>clearInterval(timer);
  },[]);
  if(!active)return null;
  return <section className="great-signal-layer"><h2>{language==='tr'?'Büyük İşaret 2026':'The Great Signal 2026'}</h2><p>{language==='tr'?'20–22 Aralık · İstanbul saati · Bir yetişkinle':'20–22 December · Europe/Istanbul · With a grown-up'}</p><Link className="button button-gold" href={localizedPath('/challenge/shadow-signal',language)}>{language==='tr'?'Bu gece gölge işaretinizi gönderdiniz mi? Yıldızınızı ekleyin.':'Sent your shadow signal tonight? Add your star.'}</Link></section>;
}
