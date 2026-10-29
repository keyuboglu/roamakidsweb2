'use client';

import {usePathname} from 'next/navigation';
import {useLanguage} from '@/components/FunnelPreferences';
import {localizedPath,type Language} from '@/lib/funnel';

export default function LanguageSwitch() {
  const language=useLanguage();
  const pathname=usePathname();
  if(pathname.startsWith('/admin'))return null;

  function preserveUrl(event:React.MouseEvent<HTMLAnchorElement>,next:Language) {
    event.currentTarget.href=localizedPath(`${location.pathname}${location.search}${location.hash}`,next);
  }

  return <div className="language-bar">
    <span>{language==='tr'?'Dil':'Language'}</span>
    <nav aria-label={language==='tr'?'Dil seçimi':'Language selection'}>
      <a href={localizedPath(pathname,'tr')} lang="tr" aria-current={language==='tr'?'true':undefined} onClick={event=>preserveUrl(event,'tr')}>Türkçe</a>
      <a href={localizedPath(pathname,'en')} lang="en" aria-current={language==='en'?'true':undefined} onClick={event=>preserveUrl(event,'en')}>English</a>
    </nav>
  </div>;
}
