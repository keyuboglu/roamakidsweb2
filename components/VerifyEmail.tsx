'use client';

import {useState} from 'react';
import Link from 'next/link';
import AppBridge from '@/components/AppBridge';
import {useLanguage} from '@/components/FunnelPreferences';
import {localizedPath} from '@/lib/funnel';
import StarCardActions from '@/components/StarCardActions';
import {appendAttribution,sanitizeAttribution,type Attribution} from '@/lib/attribution';

type Star={starNumber:number;starName:string|null;count:number;recovered:boolean;attribution?:Attribution;challengeSlug?:string};

function isStar(value:unknown):value is Star {
  if(typeof value!=='object'||value===null)return false;
  const valid='starNumber' in value&&typeof value.starNumber==='number'
    &&'starName' in value&&(typeof value.starName==='string'||value.starName===null)
    &&'count' in value&&typeof value.count==='number'
    &&'recovered' in value&&typeof value.recovered==='boolean';
  return valid&&(!('attribution' in value)||typeof value.attribution==='object')
    &&(!('challengeSlug' in value)||typeof value.challengeSlug==='string');
}

export default function VerifyEmail() {
  const language=useLanguage();
  const tr=language==='tr';
  const t=(en:string,turkish:string)=>tr?turkish:en;
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [star,setStar]=useState<Star|null>(null);
  const [notice,setNotice]=useState('');

  async function verify() {
    const token=window.location.hash.slice(1);
    if(!/^[a-f0-9]{64}$/i.test(token)){
      setError(t('This verification link is invalid or incomplete. Request a new link from the challenge page.','Bu doğrulama bağlantısı geçersiz veya eksik. Görev sayfasından yeni bağlantı isteyin.'));
      return;
    }
    window.history.replaceState(null,'',`${window.location.pathname}${window.location.search}`);
    setBusy(true);
    setError('');
    try {
      const response=await fetch('/api/verification/verify',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({token}),
      });
      const result:unknown=await response.json();
      if(!response.ok){
        const message=typeof result==='object'&&result!==null&&'error' in result&&typeof result.error==='string'
          ?result.error
          :'The email could not be verified. Request a new link and try again.';
        throw new Error(message);
      }
      if(!isStar(result))throw new Error('The verification service returned an unexpected response. Request a fresh link if needed.');
      setStar({...result,attribution:sanitizeAttribution(result.attribution)});
    } catch(caught) {
      setError(tr?'Doğrulama tamamlanamadı. Bağlantı kullanılmış veya süresi dolmuş olabilir. Görev sayfasından yeni bir bağlantı isteyin.':caught instanceof Error?caught.message:'Verification failed. Request a new link and try again.');
    } finally {
      setBusy(false);
    }
  }

  if(star)return <main className="detail-page verify-page">
    <Link href={localizedPath('/',language)} className="detail-back">← {t('The Great Signal Quest','Büyük Sinyal Macerası')}</Link>
    <p className="eyebrow">{t('YOUR PLACE IN THE SKY','GÖKYÜZÜNDEKİ YERİNİZ')}</p>
    <div className="star-reveal">
      <svg className="reveal-star" viewBox="0 0 120 120" role="img" aria-label={t('A golden star','Altın bir yıldız')}>
        <path d="m60 4 14 37 40 2-31 25 11 39-34-22-34 22 11-39L6 43l40-2z" fill="#e7c374"/>
        <circle cx="60" cy="60" r="57" fill="none" stroke="#e7c374" strokeOpacity=".35"/>
      </svg>
      <h1>{t('Star','Yıldız')} #{String(star.starNumber).padStart(6,'0')}</h1>
      {star.starName&&<p className="reveal-name">{star.starName}</p>}
      <p className="detail-lede">{star.recovered?t('Your existing permanent star is ready.','Mevcut kalıcı yıldızınız hazır.'):t('Your permanent star is ready.','Kalıcı yıldızınız hazır.')} {t('ROAMA Signal Quest · The Great Signal Quest','ROAMA Sinyal Macerası · Büyük Sinyal Macerası')}</p>
      <p className="reveal-tagline">{t('One world. One million places to shine.','Tek dünya. Parlamak için bir milyon yer.')}</p>
      <p className="reveal-count">{star.count.toLocaleString(tr?'tr-TR':'en-US')} {t('verified adult-email star claims','doğrulanmış yetişkin e-postasıyla alınan yıldız')}</p>
      <StarCardActions starNumber={star.starNumber} starName={star.starName} attribution={star.attribution} onStatus={setNotice}/>
      {notice&&<p className="verify-notice" role="status">{notice}</p>}
      <p><Link className="text-link" href={appendAttribution(localizedPath(`/stars?star=${star.starNumber}`,language),star.attribution||{})}>{t('Find your star in the sky','Gökyüzünde yıldızınızı bulun')} →</Link></p>
    </div>
    <AppBridge slug={star.challengeSlug} attribution={star.attribution}/>
  </main>;

  return <main className="detail-page verify-page">
    <Link href={localizedPath('/',language)} className="detail-back">← {t('The Great Signal Quest','Büyük Sinyal Macerası')}</Link>
    <p className="eyebrow">{t('ADULT EMAIL CONFIRMATION','YETİŞKİN E-POSTA ONAYI')}</p>
    <h1>{t('Reveal your star.','Yıldızınızı görün.')}</h1>
    <p className="detail-lede">{t('This one-time link confirms the adult email and creates or recovers its permanent star. It expires after 20 minutes.','Bu tek kullanımlık bağlantı yetişkin e-postasını doğrular ve kalıcı yıldızı oluşturur veya mevcut yıldızınızı getirir. 20 dakika sonra geçerliliğini yitirir.')}</p>
    <button className="button button-gold verify-button" onClick={()=>void verify()} disabled={busy}>{busy?t('Verifying…','Doğrulanıyor…'):t('Verify email and reveal my star','E-postamı doğrula ve yıldızımı göster')}</button>
    {error&&<p className="completion-error" role="alert">{error}</p>}
    <p className="verify-retry">{t('If this link has expired or was already used, return to the challenge and request a fresh link. Your email is not used for marketing.','Bağlantının süresi dolmuşsa veya zaten kullanılmışsa görev sayfasından yeni bağlantı isteyin. E-postanız pazarlama için kullanılmaz.')}</p>
    <Link className="text-link" href={localizedPath('/#challenges',language)}>{t('Return to the campaign','Kampanyaya dön')}</Link>
  </main>;
}
