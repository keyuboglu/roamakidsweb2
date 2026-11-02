'use client';

import {useState} from 'react';
import {useLanguage} from '@/components/FunnelPreferences';
import {trackEvent} from '@/lib/client-analytics';
import {challengeShareText,challengeShareUrl} from '@/lib/challenge-share';

export default function ChallengeShareActions({slug,title}:{slug:string;title:string}) {
  const language=useLanguage();
  const tr=language==='tr';
  const [status,setStatus]=useState('');
  const url=challengeShareUrl(slug,language);
  const text=challengeShareText(title,language);
  const email=new URLSearchParams({subject:text,body:`${text}\n${url}`});

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus(tr?'Bağlantı kopyalandı.':'Link copied.');
      trackEvent('share',{slug,target:'copy_link'});
    } catch {
      setStatus(tr?'Bağlantı kopyalanamadı. Lütfen adres çubuğundan kopyalayın.':'Could not copy the link. Please copy it from the address bar.');
    }
  }

  return <section className="challenge-share" aria-labelledby="challenge-share-heading">
    <h2 id="challenge-share-heading">{tr?'Bir yetişkinle paylaşın':'Share with another grown-up'}</h2>
    <p>{tr?'Paylaşım isteğe bağlıdır. Çocukların fotoğrafı veya kişisel bilgisi gerekmez.':'Sharing is optional. No child photo or personal information is needed.'}</p>
    <div className="challenge-share-actions">
      <a className="button button-share" href={`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`} target="_blank" rel="noopener noreferrer" onClick={()=>trackEvent('share',{slug,target:'whatsapp'})}>WhatsApp</a>
      <a className="button button-share" href={`mailto:?${email.toString()}`} onClick={()=>trackEvent('share',{slug,target:'email'})}>{tr?'E-posta':'Email'}</a>
      <button className="button button-share" type="button" onClick={()=>void copyLink()}>{tr?'Bağlantıyı kopyala':'Copy link'}</button>
    </div>
    <p className="challenge-share-status" role="status" aria-live="polite">{status}</p>
  </section>;
}
