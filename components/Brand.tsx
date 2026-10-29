'use client';

import Image from 'next/image';
import Link from 'next/link';
import {useLanguage} from '@/components/FunnelPreferences';

export default function Brand({href='/'}:{href?:string}) {
  const tr=useLanguage()==='tr';
  return <Link className="brand" href={href} aria-label={tr?'ROAMA Kids macera ana sayfası':'ROAMA Kids quest home'}>
    <Image src="/roama-logo.webp" alt="" width={44} height={44} unoptimized/>
    <span>ROAMA <b>KIDS</b></span>
  </Link>;
}
