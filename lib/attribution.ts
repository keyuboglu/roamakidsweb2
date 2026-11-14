import {analyticsSource,type AnalyticsSource} from '@/lib/anonymous-analytics';

export type Attribution={source?:AnalyticsSource};

export function sanitizeAttribution(value:unknown):Attribution {
  if(typeof value!=='object'||value===null||!('source' in value))return {};
  return {source:analyticsSource(value.source)};
}

export function readAttribution(search:string):Attribution {
  const source=new URLSearchParams(search).get('utm_source');
  return source===null?{}:{source:analyticsSource(source)};
}

export function currentAttribution():Attribution {
  return typeof window==='undefined'?{}:readAttribution(window.location.search);
}

export function trackedChallengeUrl(path:string) {
  return appendAttribution(path,{source:'share'});
}

export function appendAttribution(path:string,attribution:Attribution) {
  if(!path.startsWith('/')||path.startsWith('//'))throw new Error('Attribution can only be appended to a local path.');
  const hashIndex=path.indexOf('#');
  const hash=hashIndex<0?'':path.slice(hashIndex);
  const [pathname,query='']=(hashIndex<0?path:path.slice(0,hashIndex)).split('?');
  const params=new URLSearchParams(query);
  for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','ref'])params.delete(key);
  const {source}=sanitizeAttribution(attribution);
  if(source)params.set('utm_source',source);
  return `${pathname}${params.size?`?${params.toString()}`:''}${hash}`;
}

export function attributionFields(attribution:Attribution) {
  return sanitizeAttribution(attribution);
}
