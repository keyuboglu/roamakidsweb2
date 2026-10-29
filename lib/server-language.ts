import {headers} from 'next/headers';
import type {Language} from '@/lib/funnel';
import {getCanonicalOrigin} from '@/lib/site-url';

export async function serverLanguage():Promise<Language> {
  return (await headers()).get('x-roama-language')==='tr'?'tr':'en';
}

export function languageAlternates(path:string,language:Language) {
  const base=`${getCanonicalOrigin()}${path}`;
  return {
    canonical:language==='tr'?`${base}?lang=tr`:base,
    languages:{en:`${base}?lang=en`,tr:`${base}?lang=tr`,'x-default':base},
  };
}
