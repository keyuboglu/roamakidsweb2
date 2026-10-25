'use client';

import {useState,type FormEvent} from 'react';
import Link from 'next/link';

export default function CompletionForm({challengeSlug,verificationEnabled}:{challengeSlug:string;verificationEnabled:boolean}) {
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
        }),
      });
      const result=await response.json() as {message?:string;error?:string};
      if(!response.ok)throw new Error(result.error||'Your verification request could not be sent. Please try again.');
      setMessage(result.message||'If the request can be completed, a verification link will arrive shortly.');
      formElement.reset();
      setStarName('');
    } catch(caught) {
      setError(caught instanceof Error?caught.message:'The request could not be sent. Check your connection and retry.');
    } finally {
      setBusy(false);
    }
  }

  if(!verificationEnabled)return <div className="claim-paused" role="status">
    <p><strong>Star claims are temporarily paused.</strong> Email verification is not configured, so no email was collected and no star was created. Please check back later.</p>
    <Link href="/privacy">Privacy information</Link>
  </div>;

  return <form className="completion-form" onSubmit={event=>void submit(event)}>
    <label className="completion-field">Parent, guardian, or adult organizer email
      <input name="email" type="email" autoComplete="email" maxLength={254} required/>
    </label>
    <label className="completion-field">Made-up name for your star <span>(optional; publicly visible)</span>
      <input name="starName" value={starName} onChange={event=>setStarName(event.target.value)} maxLength={40} autoComplete="off"/>
    </label>
    {starName.trim()&&<label className="completion-check"><input name="publicNameConfirmed" type="checkbox" required/> I confirm this is a fictional name with no personal information and may be shown publicly.</label>}
    <label className="completion-check"><input name="adultConfirmed" type="checkbox" required/> I am an adult organizer and confirm that the challenge was completed safely.</label>
    <label className="completion-honeypot" aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off"/></label>
    <button className="button button-gold" type="submit" disabled={busy}>{busy?'Sending verification…':'Email me a verification link'}</button>
    <p className="completion-privacy">Use an adult email, not a child’s. Verification is not marketing consent. <Link href="/privacy">Privacy details</Link></p>
    {message&&<p className="completion-message" role="status">{message}</p>}
    {error&&<p className="completion-error" role="alert">{error}</p>}
  </form>;
}
