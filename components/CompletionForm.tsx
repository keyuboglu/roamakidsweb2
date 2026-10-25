'use client';

import {useRef,useState} from 'react';
import Link from 'next/link';
import {STAR_NAME_MAX_LENGTH} from '@/lib/stars';

type Result={count:number;duplicate:boolean;starNumber:number;starName:string|null};

export default function CompletionForm({slug,goal,onSuccess}:{slug:string;goal:number;onSuccess?:(result:Result)=>void}) {
  const [adult,setAdult]=useState(false);
  const [name,setName]=useState('');
  const [publicConfirmed,setPublicConfirmed]=useState(false);
  const [website,setWebsite]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [result,setResult]=useState<Result|null>(null);
  const pendingKey=useRef<string|null>(null);

  async function submit(event:React.FormEvent) {
    event.preventDefault();
    if(busy||!adult)return;
    setBusy(true);
    setError('');
    try {
      const storageKey=`roama_pending_key:${slug}`;
      const key=pendingKey.current||sessionStorage.getItem(storageKey)||crypto.randomUUID();
      pendingKey.current=key;
      sessionStorage.setItem(storageKey,key);
      const response=await fetch('/api/completions',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({challengeSlug:slug,idempotencyKey:key,adultConfirmed:true,website,starName:name.trim(),publicNameConfirmed:publicConfirmed}),
      });
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'Could not add your star. Please try again.');
      sessionStorage.removeItem(storageKey);
      setResult(data);
      onSuccess?.(data);
    } catch(error) {
      setError(error instanceof Error?error.message:'Could not add your star. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if(result)return <div className="star-receipt" role="status">
    <span className="success-icon" aria-hidden="true">✦</span>
    <p className="eyebrow">SIGNAL RECEIVED · STAR #{result.starNumber.toLocaleString('en-US')}</p>
    <h2>{result.starName||'Your star is shining.'}</h2>
    <p>Your adult-confirmed discovery now has a permanent place in our million-star sky.</p>
    <p className="success-count"><strong>{result.count.toLocaleString('en-US')}</strong> / {goal.toLocaleString('en-US')} stars</p>
    <Link className="button button-gold" href={`/stars?star=${result.starNumber}`}>Find my star <span>↗</span></Link>
  </div>;

  return <form className="completion-form" onSubmit={event=>void submit(event)}>
    <label className="star-name-label" htmlFor={`star-name-${slug}`}>Name your star <span>(optional)</span></label>
    <input className="star-name-input" id={`star-name-${slug}`} value={name} maxLength={STAR_NAME_MAX_LENGTH} placeholder="Brave Explorer" autoComplete="off" aria-describedby={`star-name-help-${slug}`} onChange={event=>{setName(event.target.value);setPublicConfirmed(false);}}/>
    <p className="star-name-help" id={`star-name-help-${slug}`}>Choose a made-up star name, not a child&apos;s real name. Never include contact details, a school, or a location. Star names are public.</p>
    {name.trim()&&<label className="adult-check"><input type="checkbox" checked={publicConfirmed} onChange={event=>setPublicConfirmed(event.target.checked)} required/><span>I confirm this is a made-up name, contains no personal information, and may be shown publicly.</span></label>}
    <label className="adult-check"><input type="checkbox" checked={adult} onChange={event=>{
      setAdult(event.target.checked);
      if(event.target.checked)void fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'completion_started',slug})}).catch(error=>console.warn('Completion-start analytics unavailable.',error));
    }} required/><span>I&apos;m a parent, guardian, or adult organizer, and I confirm this challenge was completed safely.</span></label>
    <label className="honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={event=>setWebsite(event.target.value)}/></label>
    {error&&<p className="form-error" role="alert">{error}</p>}
    <button className="button button-gold" disabled={!adult||busy||Boolean(name.trim()&&!publicConfirmed)}>{busy?'Adding your star…':'Confirm & add your star ✦'}</button>
    <p className="modal-note">One safely completed challenge. One real star. <Link href="/privacy">Privacy information</Link></p>
  </form>;
}
