export function trackStoreClick(store:'ios'|'android') {
  void fetch('/api/events',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({event:'store_click',store}),
  }).catch(error=>console.warn('Store analytics unavailable.',error));
}
