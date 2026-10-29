'use client';

import {useState,type FormEvent} from 'react';
import Link from 'next/link';
import {attributionFields,currentAttribution} from '@/lib/attribution';
import {useLanguage} from '@/components/FunnelPreferences';
import {localizedPath} from '@/lib/funnel';

export default function CompletionForm({challengeSlug,verificationEnabled}:{challengeSlug:string;verificationEnabled:boolean}) {
  const language=useLanguage();
  const tr=language==='tr';
  const [starName,setStarName]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement=event.currentTarget;
    setBusy(true);
    setMessage('');
    setError('');
    const form=new FormData(formElement);
    try {
      const response=await fetch('/api/verification/request',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          email:form.get('email'),
          challengeSlug,
          adultConfirmed:form.get('adultConfirmed')==='on',
          starName:form.get('starName'),
          publicNameConfirmed:form.get('publicNameConfirmed')==='on',
          website:form.get('website'),
          language,
          ...attributionFields(currentAttribution()),
        }),
      });
      const result=await response.json() as {message?:string;error?:string};
      if(!response.ok)throw new Error(tr?'Doğrulama isteği gönderilemedi. Lütfen daha sonra tekrar deneyin.':result.error||'Your verification request could not be sent. Please try again.');
      setMessage(tr?'İstek tamamlanabiliyorsa kısa süre içinde bir doğrulama bağlantısı alacaksınız.':result.message||'If the request can be completed, a verification link will arrive shortly.');
      formElement.reset();
      setStarName('');
    } catch(caught) {
      setError(tr?'Doğrulama isteği gönderilemedi. Bağlantınızı kontrol edip daha sonra tekrar deneyin.':caught instanceof Error?caught.message:'The request could not be sent. Check your connection and retry.');
    } finally {
      setBusy(false);
    }
  }

  if(!verificationEnabled)return <div className="claim-paused" role="status">
    <p><strong>{tr?'E-posta doğrulaması geçici olarak kullanılamıyor.':'Email verification is temporarily unavailable.'}</strong> {tr?'E-posta toplanmaz ve yıldız oluşturulmaz. Görevi uygulama olmadan gizli olarak tamamlayabilirsiniz.':'No email is collected and no star is created. You can still complete this challenge privately without the app.'}</p>
    <Link href={localizedPath('/privacy',language)}>{tr?'Gizlilik bilgileri':'Privacy information'}</Link>
  </div>;

  return <form className="completion-form" onSubmit={event=>void submit(event)}>
    <label className="completion-field">{tr?'Ebeveyn, vasi veya yetişkin düzenleyicinin e-postası':'Parent, guardian, or adult organizer email'}
      <input name="email" type="email" autoComplete="email" maxLength={254} required/>
    </label>
    <label className="completion-field">{tr?'Yıldızınız için hayalî bir ad':'Made-up name for your star'} <span>{tr?'(isteğe bağlı; herkese görünür)':'(optional; publicly visible)'}</span>
      <input name="starName" value={starName} onChange={event=>setStarName(event.target.value)} maxLength={40} autoComplete="off"/>
    </label>
    {starName.trim()&&<label className="completion-check"><input name="publicNameConfirmed" type="checkbox" required/> {tr?'Bu adın hayalî olduğunu, kişisel bilgi içermediğini ve herkese açık gösterilebileceğini onaylıyorum.':'I confirm this is a fictional name with no personal information and may be shown publicly.'}</label>}
    <label className="completion-check"><input name="adultConfirmed" type="checkbox" required/> {tr?'Yetişkin düzenleyiciyim ve görevin güvenle tamamlandığını onaylıyorum.':'I am an adult organizer and confirm that the challenge was completed safely.'}</label>
    <label className="completion-honeypot" aria-hidden="true">{tr?'Bu alanı boş bırakın':'Leave this field empty'}<input name="website" tabIndex={-1} autoComplete="off"/></label>
    <button className="button button-gold" type="submit" disabled={busy}>{busy?(tr?'Gönderiliyor…':'Sending verification…'):(tr?'Doğrulama bağlantısını e-postayla gönder':'Email me a verification link')}</button>
    <p className="completion-privacy">{tr?'Çocuk e-postası değil, yetişkin e-postası kullanın. Doğrulama pazarlama izni değildir.':'Use an adult email, not a child’s. Verification is not marketing consent.'} <Link href={localizedPath('/privacy',language)}>{tr?'Gizlilik ayrıntıları':'Privacy details'}</Link></p>
    {message&&<p className="completion-message" role="status">{message}</p>}
    {error&&<p className="completion-error" role="alert">{error}</p>}
  </form>;
}
