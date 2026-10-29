'use client';

import {useId,useState,useSyncExternalStore,type FormEvent} from 'react';
import Link from 'next/link';
import {useDevice,useLanguage} from '@/components/FunnelPreferences';
import {OFFICIAL_IOS_STORE_URL} from '@/lib/brand';
import {currentAttribution,type Attribution} from '@/lib/attribution';
import {trackStoreClick} from '@/lib/client-analytics';
import {daysUntilAndroidLaunch} from '@/lib/funnel';

function subscribeClock(callback:()=>void) {
  const timer=window.setInterval(callback,60000);
  return ()=>window.clearInterval(timer);
}

export default function AppDownloadCTA({slug,attribution,compact=false}:{slug?:string;attribution?:Attribution;compact?:boolean}) {
  const language=useLanguage();
  const device=useDevice();
  const tr=language==='tr';
  const days=useSyncExternalStore(subscribeClock,daysUntilAndroidLaunch,daysUntilAndroidLaunch);
  const id=useId();
  const [busy,setBusy]=useState(false);
  const [joined,setJoined]=useState(false);
  const [error,setError]=useState('');

  async function join(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form=event.currentTarget;
    const values=new FormData(form);
    setBusy(true);
    setError('');
    try {
      const response=await fetch('/api/android-waitlist',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          email:values.get('email'),
          adultConsent:values.get('adultConsent')==='on',
          website:values.get('website'),
          language,
          source:'android_waitlist',
          completed_challenge:slug,
          attribution:attribution&&Object.keys(attribution).length?attribution:currentAttribution(),
        }),
      });
      if(!response.ok){
        throw new Error(tr
          ?(response.status===429?'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.':'Kayıt onaylanamadı. Lütfen daha sonra tekrar deneyin.')
          :(response.status===429?'Too many requests. Please wait before trying again.':'Your signup could not be confirmed. Please try again later.'));
      }
      const result:unknown=await response.json();
      if(typeof result!=='object'||result===null||!('ok' in result)||result.ok!==true){
        throw new Error(tr?'Kayıt onaylanamadı. Lütfen tekrar deneyin.':'Your signup could not be confirmed. Please retry.');
      }
      setJoined(true);
      form.reset();
    } catch(caught) {
      setError(caught instanceof Error?caught.message:(tr?'Bağlantınızı kontrol edip tekrar deneyin.':'Check your connection and retry.'));
    } finally {
      setBusy(false);
    }
  }

  if(compact){
    if(device==='ios')return <a className="nav-cta nav-cta-store" href={OFFICIAL_IOS_STORE_URL} target="_blank" rel="noreferrer" onClick={()=>trackStoreClick('ios',slug,attribution)}>App Store ↗</a>;
    return <a className="nav-cta nav-cta-store" href="#get-app">{device==='android'?(tr?'Android erken erişim':'Android early access'):(tr?'Uygulamayı keşfet':'Get the app')} ↗</a>;
  }

  const heading=days>0
    ?(tr?`Google Play lansmanına ${days} gün! Erken Kaşif Erişimi Alın`:`Launching on Google Play in ${days} Days! Get Early Explorer Access`)
    :(tr?'Google Play çok yakında! Erken Kaşif Erişimi Alın':'Coming to Google Play! Get Early Explorer Access');

  return <div className={`app-download-options app-download-${device}`} aria-busy={device==='pending'}>
    {device==='pending'&&<p role="status">{tr?'Uygulama seçenekleri yükleniyor…':'Loading app options…'}</p>}
    {(device==='ios'||device==='desktop')&&<div className="ios-download">
      <a className="button button-gold app-store-button" href={OFFICIAL_IOS_STORE_URL} target="_blank" rel="noreferrer" onClick={()=>trackStoreClick('ios',slug,attribution)}>
        {tr?'Maceraya App Store’da Devam Et':'Continue the Adventure on the App Store'} ↗
      </a>
    </div>}
    {(device==='android'||device==='desktop')&&<div className="android-waitlist">
      <h3>{device==='desktop'?(tr?'Android lansmanını bana hatırlat':'Remind me when Android launches'):heading}</h3>
      {device==='desktop'&&<p className="waitlist-launch-date">{heading}</p>}
      {joined?<p className="completion-message" role="status">{tr
        ?`Listedesiniz! ROAMA Kids ${days>=7?'gelecek hafta ':''}Google Play’e geldiğinde size e-posta göndereceğiz.`
        :`You're on the list! We'll email you the moment ROAMA Kids hits Google Play${days>=7?' next week':''}.`}</p>
        :<form onSubmit={event=>void join(event)}>
          <label htmlFor={`${id}-email`}>{tr?'Yetişkin e-posta adresi':'Adult email address'}</label>
          <div className="waitlist-input-row">
            <input id={`${id}-email`} name="email" type="email" autoComplete="email" maxLength={254} placeholder={tr?'E-posta adresiniz':'Your email address'} required/>
            <button type="submit" className="button button-gold" disabled={busy}>{busy?(tr?'Kaydediliyor…':'Saving…'):(tr?'Bana haber ver':'Notify me')}</button>
          </div>
          <label className="completion-check"><input name="adultConsent" type="checkbox" required/>{tr?'Yetişkinim ve yalnızca ROAMA Kids Android lansman e-postasını almak istiyorum.':'I am an adult and want the ROAMA Kids Android launch email only.'}</label>
          <label className="completion-honeypot" aria-hidden="true">Leave empty<input name="website" tabIndex={-1} autoComplete="off"/></label>
          <p className="completion-privacy">{tr?'Çocuk e-postası kullanmayın. Yıldız doğrulamasından ayrıdır; başka pazarlama aboneliği oluşturmaz.':'Do not use a child’s email. Separate from star verification; no other marketing subscription.'} <Link href="/privacy">{tr?'Gizlilik':'Privacy'}</Link></p>
          {error&&<p className="completion-error" role="alert">{error}</p>}
        </form>}
    </div>}
  </div>;
}
