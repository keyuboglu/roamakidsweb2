'use client';

import {useId,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {useDevice,useLanguage} from '@/components/FunnelPreferences';
import {appStoreUrl,OFFICIAL_IOS_STORE_URL} from '@/lib/brand';
import {currentAttribution,type Attribution} from '@/lib/attribution';
import {trackStoreClick} from '@/lib/client-analytics';
import {localizedPath} from '@/lib/funnel';

export default function AppDownloadCTA({slug,attribution,compact=false,completion=false}:{slug?:string;attribution?:Attribution;compact?:boolean;completion?:boolean}) {
  const language=useLanguage();
  const device=useDevice();
  const tr=language==='tr';
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
      setError(tr?'Kayıt onaylanamadı. Bağlantınızı kontrol edip daha sonra tekrar deneyin.':caught instanceof Error?caught.message:'Check your connection and retry.');
    } finally {
      setBusy(false);
    }
  }

  const campaign=completion?'signalquest_complete':'signalquest';
  const storeUrl=completion?appStoreUrl(campaign):OFFICIAL_IOS_STORE_URL;

  if(compact){
    if(device==='ios')return <a className="nav-cta nav-cta-store" href={storeUrl} target="_blank" rel="noreferrer" onClick={()=>trackStoreClick('ios',slug,attribution)}>App Store ↗</a>;
    return <a className="nav-cta nav-cta-store" href="#get-app">{device==='android'?(tr?'Android erken erişim':'Android early access'):(tr?'Uygulamayı keşfet':'Get the app')} ↗</a>;
  }

  const showStore=device==='ios'||device==='desktop'||device==='pending';
  const showWaitlist=device==='android'||device==='desktop'||device==='pending';

  return <div className={`app-download-options app-download-${device}`}>
    {showStore&&<div className="ios-download">
      <a className="button button-gold app-store-button" href={storeUrl} target="_blank" rel="noreferrer" onClick={()=>trackStoreClick('ios',slug,attribution)}>
        {tr?'Maceraya App Store’da Devam Et':'Continue the Adventure on the App Store'} ↗
      </a>
    </div>}
    {showWaitlist&&<div className="android-waitlist">
      <h3>{device==='desktop'?(tr?'Android lansmanını bana hatırlat':'Remind me when Android launches'):(tr?'Google Play’de çok yakında':'Coming soon on Google Play')}</h3>
      {joined?<p className="completion-message" role="status">{tr
        ?'Listeye kaydoldunuz! ROAMA Kids Google Play’de yayınlandığında size e-posta göndereceğiz.'
        :"You're on the list! We'll email you when ROAMA Kids is available on Google Play."}</p>
        :<form onSubmit={event=>void join(event)}>
          <label htmlFor={`${id}-email`}>{tr?'Yetişkin e-posta adresi':'Adult email address'}</label>
          <div className="waitlist-input-row">
            <input id={`${id}-email`} name="email" type="email" autoComplete="email" maxLength={254} placeholder={tr?'E-posta adresiniz':'Your email address'} required/>
            <button type="submit" className="button button-gold" disabled={busy}>{busy?(tr?'Kaydediliyor…':'Saving…'):(tr?'Bana haber ver':'Notify me')}</button>
          </div>
          <label className="completion-check"><input name="adultConsent" type="checkbox" required/>{tr?'Yetişkinim ve yalnızca ROAMA Kids Android lansman e-postasını almak istiyorum.':'I am an adult and want the ROAMA Kids Android launch email only.'}</label>
          <label className="completion-honeypot" aria-hidden="true">{tr?'Boş bırakın':'Leave empty'}<input name="website" tabIndex={-1} autoComplete="off"/></label>
          <p className="completion-privacy">{tr?'Çocuk e-postası kullanmayın. Yıldız doğrulamasından ayrıdır; başka pazarlama aboneliği oluşturmaz.':'Do not use a child’s email. Separate from star verification; no other marketing subscription.'} <Link href={localizedPath('/privacy',language)}>{tr?'Gizlilik':'Privacy'}</Link></p>
          {error&&<p className="completion-error" role="alert">{error}</p>}
        </form>}
    </div>}
  </div>;
}
