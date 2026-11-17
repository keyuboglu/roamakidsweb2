import {currentAttribution,type Attribution} from '@/lib/attribution';
import {analyticsSource,anonymousEvent,type ClientEvent} from '@/lib/anonymous-analytics';

export type {ClientEvent} from '@/lib/anonymous-analytics';
export type EventDetails={slug?:string;store?:'ios'|'android';target?:string};

export function trackEvent(event:ClientEvent,details:EventDetails={},attribution?:Attribution) {
  const campaignAttribution=attribution&&Object.keys(attribution).length?attribution:currentAttribution();
  void fetch('/api/events',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    credentials:'omit',
    referrerPolicy:'no-referrer',
    keepalive:true,
    body:JSON.stringify({
      event:anonymousEvent(event,details.slug,typeof window==='undefined'?undefined:window.location.pathname),
      source:analyticsSource(campaignAttribution.source),
    }),
  }).then(response=>{
    if(!response.ok)console.warn('Campaign analytics unavailable.',response.status);
  }).catch(()=>console.warn('Campaign analytics network request failed.'));
}

export function trackStoreClick(store:'ios'|'android',slug?:string,attribution?:Attribution) {
  trackEvent(store==='ios'?'app_store_click':'store_click',{store,slug,target:store==='ios'?'app_store':'google_play'},attribution);
}
