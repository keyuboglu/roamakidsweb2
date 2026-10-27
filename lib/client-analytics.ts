import {attributionFields,readAttribution,type Attribution} from '@/lib/attribution';

export type ClientEvent='page_view'|'challenge_view'|'completion_started'|'share'|'store_click'|'star_card_downloaded'|'star_card_shared';
export type EventDetails={slug?:string;store?:'ios'|'android';target?:string};

export function trackEvent(event:ClientEvent,details:EventDetails={},attribution?:Attribution) {
  const campaignAttribution=attribution||(typeof window==='undefined'?{}:readAttribution(window.location.search));
  void fetch('/api/events',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    keepalive:true,
    body:JSON.stringify({event,...details,...attributionFields(campaignAttribution)}),
  }).catch(error=>console.warn('Campaign analytics unavailable.',error));
}

export function trackStoreClick(store:'ios'|'android',slug?:string,attribution?:Attribution) {
  trackEvent('store_click',{store,slug,target:'app_store'},attribution);
}
