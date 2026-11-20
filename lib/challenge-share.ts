import type {Language} from '@/lib/funnel';
import {localizedPath} from '@/lib/funnel';
import {PRODUCTION_SITE_URL} from '@/lib/site-url';

export function challengeShareUrl(slug:string,language:Language) {
  const url=new URL(localizedPath(`/challenge/${slug}?utm_source=share`,language),PRODUCTION_SITE_URL);
  return url.toString();
}

export function challengeShareText(title:string,language:Language) {
  return language==='tr'
    ?`Ailece ${title} görevini yaptık — 6–12 yaş için ücretsiz, uygulamasız bir görev`
    :`We just did ${title} — a free no-app challenge for 6–12s`;
}
