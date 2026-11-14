export const ANALYTICS_SOURCES=['direct','wa','email','share','tiktok','instagram','facebook','youtube','google','bing','roamatech','signalquest','signal_card','other'] as const;
export type AnalyticsSource=typeof ANALYTICS_SOURCES[number];
export const CLIENT_EVENTS=['page_view','challenge_view','challenge_start','challenge_complete','app_store_click','completion_started','share','store_click','star_card_downloaded','star_card_shared'] as const;
export type ClientEvent=typeof CLIENT_EVENTS[number];
const missions=['shadow-signal','micro-world-safari','gravity-defier'];
export const ANALYTICS_PAGES=['/','/stars','/privacy'];

export function analyticsSource(value:unknown):AnalyticsSource {
  if(typeof value!=='string'||!value.trim())return 'direct';
  const source=value.trim().toLowerCase();
  if(source==='whatsapp')return 'wa';
  return ANALYTICS_SOURCES.find(allowed=>allowed===source)||'other';
}

export function anonymousEvent(event:ClientEvent,slug?:string,page?:string) {
  if(event==='page_view')return `page_view:${ANALYTICS_PAGES.includes(page||'')?page:'/'}`;
  if(slug&&missions.includes(slug))return `${event}:${slug}`;
  return event;
}

export const ANONYMOUS_EVENTS=new Set(CLIENT_EVENTS.flatMap(event=>event==='page_view'
  ?ANALYTICS_PAGES.map(page=>anonymousEvent(event,undefined,page))
  :[event,...missions.map(slug=>anonymousEvent(event,slug))]));

export function analyticsDay(now=new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
}

export function analyticsCutoff(now=new Date()) {
  return new Date(analyticsDay(now).getTime()-29*86400000);
}
