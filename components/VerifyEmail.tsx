'use client';

import {useState} from 'react';
import Link from 'next/link';
import {OFFICIAL_IOS_STORE_URL} from '@/lib/brand';
import {trackStoreClick} from '@/lib/client-analytics';
import StarCardActions from '@/components/StarCardActions';
import {appendAttribution,sanitizeAttribution,type Attribution} from '@/lib/attribution';

type Star={starNumber:number;starName:string|null;count:number;recovered:boolean;attribution?:Attribution};

function isStar(value:unknown):value is Star {
  if(typeof value!=='object'||value===null)return false;
  const valid='starNumber' in value&&typeof value.starNumber==='number'
    &&'starName' in value&&(typeof value.starName==='string'||value.starName===null)
    &&'count' in value&&typeof value.count==='number'
    &&'recovered' in value&&typeof value.recovered==='boolean';
  return valid&&(!('attribution' in value)||typeof value.attribution==='object');
}

export default function VerifyEmail() {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [star,setStar]=useState<Star|null>(null);
  const [notice,setNotice]=useState('');

  async function verify() {
    const token=window.location.hash.slice(1);
    if(!/^[a-f0-9]{64}$/i.test(token)){
      setError('This verification link is invalid or incomplete. Request a new link from the challenge page.');
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
      setError(caught instanceof Error?caught.message:'Verification failed. Request a new link and try again.');
    } finally {
      setBusy(false);
    }
  }

  if(star)return <main className="detail-page verify-page">
    <Link href="/" className="detail-back">← The Great Signal Quest</Link>
    <p className="eyebrow">YOUR PLACE IN THE SKY</p>
    <div className="star-reveal">
      <svg className="reveal-star" viewBox="0 0 120 120" role="img" aria-label="A golden star">
        <path d="m60 4 14 37 40 2-31 25 11 39-34-22-34 22 11-39L6 43l40-2z" fill="#e7c374"/>
        <circle cx="60" cy="60" r="57" fill="none" stroke="#e7c374" strokeOpacity=".35"/>
      </svg>
      <h1>Star #{String(star.starNumber).padStart(6,'0')}</h1>
      {star.starName&&<p className="reveal-name">{star.starName}</p>}
      <p className="detail-lede">{star.recovered?'Your existing permanent star is ready.':'Your permanent star is ready.'} ROAMA Signal Quest · The Great Signal Quest</p>
      <p className="reveal-tagline">One world. One million places to shine.</p>
      <p className="reveal-count">{star.count.toLocaleString('en-US')} verified adult-email star claims</p>
      <StarCardActions starNumber={star.starNumber} starName={star.starName} attribution={star.attribution} onStatus={setNotice}/>
      {notice&&<p className="verify-notice" role="status">{notice}</p>}
      <p><Link className="text-link" href={appendAttribution(`/stars?star=${star.starNumber}`,star.attribution||{})}>Find your star in the sky →</Link></p>
      <a className="store-button reveal-store" href={OFFICIAL_IOS_STORE_URL} target="_blank" rel="noreferrer" onClick={()=>trackStoreClick('ios',undefined,star.attribution)}>
        Discover ROAMA Kids on the App Store ↗
      </a>
    </div>
  </main>;

  return <main className="detail-page verify-page">
    <Link href="/" className="detail-back">← The Great Signal Quest</Link>
    <p className="eyebrow">ADULT EMAIL CONFIRMATION</p>
    <h1>Reveal your star.</h1>
    <p className="detail-lede">This one-time link confirms the adult email and creates or recovers its permanent star. It expires after 20 minutes.</p>
    <button className="button button-gold verify-button" onClick={()=>void verify()} disabled={busy}>{busy?'Verifying…':'Verify email and reveal my star'}</button>
    {error&&<p className="completion-error" role="alert">{error}</p>}
    <p className="verify-retry">If this link has expired or was already used, return to the challenge and request a fresh link. Your email is not used for marketing.</p>
    <Link className="text-link" href="/#challenges">Return to the campaign</Link>
  </main>;
}
