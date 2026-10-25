'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Brand from '@/components/Brand';
import CompletionForm from '@/components/CompletionForm';
import {OFFICIAL_IOS_STORE_URL} from '@/lib/brand';

type Challenge={slug:string;title:string;shortDescription:string;description:string;instructions:string;safety:string;duration:string|null;imageUrl:string|null};

export default function ChallengeDetail({challenge}:{challenge:Challenge}) {
  const [goal,setGoal]=useState(1000000);
  const [notice,setNotice]=useState('');
  useEffect(()=>{
    const controller=new AbortController();
    void fetch('/api/campaign',{signal:controller.signal}).then(async response=>{
      if(!response.ok)throw new Error('Campaign data unavailable.');
      const data=await response.json();
      setGoal(data.goal);
    }).catch(error=>{if(!controller.signal.aborted)console.warn('Challenge campaign data unavailable.',error);});
    const params=new URLSearchParams(location.search);
    void fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'challenge_view',slug:challenge.slug,source:params.get('utm_source')||undefined,medium:params.get('utm_medium')||undefined,campaign:params.get('utm_campaign')||undefined})}).catch(error=>console.warn('Challenge analytics unavailable.',error));
    return ()=>controller.abort();
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
    <p className="eyebrow">A SIGNAL TO FOLLOW {challenge.duration&&`· ${challenge.duration}`}</p>
    <h1>{challenge.title}</h1><p className="detail-lede">{challenge.shortDescription}</p>
    {challenge.imageUrl&&<Image className="detail-art" src={challenge.imageUrl} alt="" width={1200} height={700} unoptimized/>}
    {challenge.description&&<section><h2>Discover</h2><p>{challenge.description}</p></section>}
    <section><h2>Your challenge</h2><p>{challenge.instructions}</p></section>
    {challenge.safety&&<section><h2>Stay safe</h2><p>{challenge.safety}</p></section>}
    <section className="detail-complete"><h2>Completed this challenge?</h2><p>A parent, guardian, or adult organizer confirms that the activity was completed safely. Choose a made-up name for your public star, or leave it unnamed.</p><CompletionForm slug={challenge.slug} goal={goal}/></section>
    <div className="detail-links"><button className="share-button" onClick={()=>void share()}>Share this challenge ↗</button><a className="text-link" href={OFFICIAL_IOS_STORE_URL} target="_blank" rel="noreferrer">ROAMA Kids on the App Store ↗</a></div>
    {notice&&<p role="status">{notice}</p>}
    <p><Link className="text-link" href="/#challenges">← Explore more challenges</Link></p>
  </main>;
}
