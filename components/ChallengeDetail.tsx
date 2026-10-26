'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Brand from '@/components/Brand';
import CompletionForm from '@/components/CompletionForm';
import {OFFICIAL_IOS_STORE_URL} from '@/lib/brand';
import {trackStoreClick} from '@/lib/client-analytics';

type Challenge={slug:string;title:string;shortDescription:string;description:string;instructions:string;safety:string;duration:string|null;imageUrl:string|null};
const imageAlt:Record<string,string>={
  'shadow-signal':'A playful household shadow taking the shape of a creature.',
  'micro-world-safari':'A close-up discovery of the patterns and details on an everyday leaf.',
  'gravity-defier':'Lightweight household objects arranged in a surprising balance.',
};

export default function ChallengeDetail({challenge,verificationEnabled}:{challenge:Challenge;verificationEnabled:boolean}) {
  const [notice,setNotice]=useState('');
  const instructionLines=challenge.instructions.split('\n').filter(Boolean);
  const steps=instructionLines.filter(line=>/^\d+\.\s/.test(line));
  const notes=instructionLines.filter(line=>!/^\d+\.\s/.test(line));
  useEffect(()=>{
    const params=new URLSearchParams(location.search);
    void fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'challenge_view',slug:challenge.slug,source:params.get('utm_source')||undefined,medium:params.get('utm_medium')||undefined,campaign:params.get('utm_campaign')||undefined})}).catch(error=>console.warn('Challenge analytics unavailable.',error));
  },[challenge.slug]);

  async function share() {
    try {
      if(navigator.share)await navigator.share({title:challenge.title,text:'Join this challenge in the Great Signal Quest.',url:location.href});
      else {await navigator.clipboard.writeText(location.href);setNotice('Challenge link copied.');}
      void fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'share',slug:challenge.slug})}).catch(error=>console.warn('Share analytics unavailable.',error));
    } catch(error) {
      if(error instanceof DOMException&&error.name==='AbortError')return;
      setNotice('The link could not be shared. You can copy it from your address bar.');
    }
  }

  return <main className="detail-page">
    <div className="detail-brand-row"><Brand/><Link className="text-link" href="/stars">Explore a million stars ↗</Link></div>
    <Link href="/" className="detail-back">← The Great Signal Quest</Link>
    <p className="eyebrow">CHOOSE ANY ONE CHALLENGE {challenge.duration&&`· ${challenge.duration}`}</p>
    <h1>{challenge.title}</h1><p className="detail-lede">{challenge.shortDescription}</p>
    {challenge.imageUrl&&<Image className="detail-art" src={challenge.imageUrl} alt={imageAlt[challenge.slug]||`Artwork for ${challenge.title}.`} width={661} height={793} loading="eager" unoptimized/>}
    {challenge.description&&<section><h2>Discover</h2><p>{challenge.description}</p></section>}
    <section><h2>Your challenge</h2>{steps.length>0?<ol className="challenge-instructions">{steps.map(step=><li key={step}>{step.replace(/^\d+\.\s/,'')}</li>)}</ol>:<p>{challenge.instructions}</p>}{notes.map(note=><p className="challenge-note" key={note}>{note}</p>)}</section>
    {challenge.safety&&<section><h2>Stay safe</h2><p>{challenge.safety}</p></section>}
    <section className="detail-complete"><h2>Completed this challenge?</h2><p>Participation is private by default. No app download, photo, video or social-media post is required. A parent, guardian, or adult organizer confirms the activity was completed safely.</p><CompletionForm challengeSlug={challenge.slug} verificationEnabled={verificationEnabled}/></section>
    <div className="detail-links"><button className="share-button" onClick={()=>void share()}>Share this challenge ↗</button><a className="text-link" href={OFFICIAL_IOS_STORE_URL} target="_blank" rel="noreferrer" onClick={()=>trackStoreClick('ios')}>ROAMA Kids on the App Store ↗</a></div>
    {notice&&<p role="status">{notice}</p>}
    <p><Link className="text-link" href="/#challenges">← Return to the challenge</Link></p>
  </main>;
}
