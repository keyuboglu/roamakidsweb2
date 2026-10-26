'use client';

import {useCallback,useEffect,useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Brand from '@/components/Brand';
import {OFFICIAL_IOS_STORE_URL,OFFICIAL_SITE_URL} from '@/lib/brand';
import {trackStoreClick} from '@/lib/client-analytics';

type Challenge={slug:string;title:string;shortDescription:string;instructions?:string;duration?:string|null;safety?:string;imageUrl?:string|null};
export type Campaign={configured:boolean;count:number|null;goal:number;title?:string;headline?:string;description?:string;milestones?:({threshold:number;label:string}|number)[];challenges:Challenge[];iosStoreUrl?:string|null;androidStoreUrl?:string|null;error?:string};
const empty:Campaign={configured:false,count:null,goal:1_000_000,challenges:[]};

function useCampaign(initial:Campaign) {
  const [data,setData]=useState(initial);
  const [status,setStatus]=useState<'ready'|'error'>(initial.configured?'ready':'error');
  const refresh=useCallback(async()=>{
    try {
      const response=await fetch('/api/campaign',{cache:'no-store'});
      if(!response.ok)throw new Error('Campaign data unavailable.');
      const campaign=await response.json() as Campaign;
      setData(campaign);
      setStatus(campaign.configured?'ready':'error');
    } catch {
      setStatus('error');
    }
  },[]);
  useEffect(()=>{
    const timer=window.setInterval(()=>void refresh(),30000);
    return ()=>clearInterval(timer);
  },[refresh]);
  return {data,status,refresh};
}

function Stars() {
  return <svg className="sky-svg" viewBox="0 0 800 620" role="img" aria-label="A constellation of luminous stars above a distant horizon"><defs><radialGradient id="glow"><stop stopColor="#ffe4a0" stopOpacity=".9"/><stop offset="1" stopColor="#f8c85e" stopOpacity="0"/></radialGradient><linearGradient id="line"><stop stopColor="#e4bd70" stopOpacity=".18"/><stop offset=".5" stopColor="#f1ce81" stopOpacity=".7"/><stop offset="1" stopColor="#e4bd70" stopOpacity=".18"/></linearGradient></defs><circle cx="455" cy="190" r="155" fill="url(#glow)" opacity=".2"/><path d="M120 450 208 337 304 376 384 246 501 286 584 164 683 232" fill="none" stroke="url(#line)" strokeWidth="1.5"/><path d="M304 376 348 487 501 286 548 406 683 232" fill="none" stroke="url(#line)" strokeWidth="1" opacity=".55"/>{[[120,450,3],[208,337,4],[304,376,3],[384,246,5],[501,286,4],[584,164,5],[683,232,3],[348,487,2],[548,406,2],[455,122,2],[250,190,2],[730,351,2],[90,240,1.5],[638,470,2]].map(([x,y,r],index)=><g key={index}><circle cx={x} cy={y} r={r*4} fill="url(#glow)"/><circle cx={x} cy={y} r={r} fill="#ffe5a2"/></g>)}<path d="M0 510 Q170 460 335 510T800 486V620H0Z" fill="#101d37"/><path d="M0 540 Q160 492 350 537T800 515" fill="none" stroke="#d7b66c" strokeOpacity=".16"/></svg>;
}

export default function Quest({initialData=empty}:{initialData?:Campaign}) {
  const {data,status,refresh}=useCampaign(initialData);
  const count=data.count;
  const progress=count===null?0:Math.min(count/data.goal*100,100);
  const litStars=count===null?0:Math.round(progress/100*28);
  const headline=data.headline||'A million stars. One global quest.';
  const sentences=headline.match(/^(.+?[.!?])\s+(.+)$/);
  const ios=OFFICIAL_IOS_STORE_URL;
  const android=data.androidStoreUrl;

  useEffect(()=>{
    const params=new URLSearchParams(location.search);
    void fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'page_view',source:params.get('utm_source')||undefined,medium:params.get('utm_medium')||undefined,campaign:params.get('utm_campaign')||undefined})}).catch(error=>console.warn('Page analytics unavailable.',error));
  },[]);

  return <main>
    <header className="topbar"><Brand/><nav><Link href="/stars">A million stars</Link><a href="#challenges">Choose a challenge</a><a href={OFFICIAL_SITE_URL} target="_blank" rel="noreferrer">ROAMA Kids ↗</a></nav><a className="nav-cta" href="#challenges">Choose your challenge <span>↗</span></a></header>
    <section className="hero" id="top"><div className="hero-copy"><p className="eyebrow"><span className="eyebrow-dot"/> A WORLDWIDE ADVENTURE</p><h1>{sentences?<>{sentences[1]}<br/><em>{sentences[2]}</em></>:headline}</h1><p className="hero-lede">{data.description||'Three real-world challenges. Infinite ways to surprise yourself. Choose any one and try it with your family. Participation is private by default; no app download is needed.'}</p><div className="hero-actions"><a className="button button-gold" href="#challenges">Choose your challenge <span>↘</span></a><Link className="text-link" href="/stars">Explore the star map <span>→</span></Link></div><p className="hero-note"><span className="tiny-star">✦</span> Complete a challenge offline. Sharing is always optional.</p></div><div className="hero-art"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="art-label label-top">SIGNAL 01 <span>✦</span></div><Stars/><div className="art-label label-bottom">SOMEWHERE, A NEW STORY BEGINS</div><span className="hero-coordinate">A SHARED ADVENTURE</span></div><div className="hero-index"><span>01</span><span className="index-line"/><span>{(data.title||'THE GREAT SIGNAL QUEST').toUpperCase()}</span></div></section>
    <section className="counter-section" aria-labelledby="counter-title"><div className="counter-intro"><p className="eyebrow">OUR SHARED JOURNEY</p><h2 id="counter-title">Every discovery<br/>leaves a little light.</h2><p>Each star is counted once, after its adult organizer verifies their email.</p><Link className="counter-map-link" href="/stars">See the million-star sky ↗</Link></div><div className="counter-card"><div className="counter-head"><span>VERIFIED ADULT STAR CLAIMS</span><span className="live"><i/> LIVE COUNT</span></div><div className="count-line" aria-live="polite" aria-atomic="true"><strong>{count===null?'—':count.toLocaleString('en-US')}</strong><span>/ {data.goal.toLocaleString('en-US')} stars</span></div>{count!==null?<div className="progress-track" role="progressbar" aria-label="Verified adult-email star claims toward the campaign target" aria-valuemin={0} aria-valuemax={data.goal} aria-valuenow={Math.min(count,data.goal)}><span style={{width:`${progress}%`}}/></div>:<div className="counter-unavailable" aria-hidden="true"/>}<div className="progress-label"><span>{status==='error'?'The live count is temporarily unavailable':`${progress.toFixed(progress<1?2:1)}% OF OUR GOAL`}</span><span>{data.goal.toLocaleString('en-US')}</span></div>{status==='error'&&<button className="retry" onClick={()=>void refresh()}>Try again</button>}<div className="mini-constellation" aria-hidden="true">{Array.from({length:28},(_,index)=><span key={index} style={{left:`${(index*37+9)%97}%`,top:`${(index*23+14)%80}%`,opacity:index<litStars?0.78:0.08}}/>)}<div className="mini-message">A constellation<br/>in the making.</div></div><p className="count-foot">One permanent star per verified adult email. No visits or unverified submissions are counted.</p></div></section>
    <section className="challenge-section" id="challenges"><div className="section-heading"><div><p className="eyebrow">PICK YOUR ADVENTURE</p><h2>Choose a challenge.</h2></div><p>Choose any one. Try it together, with no app or public post required.</p></div>{data.challenges.length?<><div className="challenge-grid">{data.challenges.slice(0,3).map((challenge,index)=><article className="challenge-card" key={challenge.slug}><Link className="challenge-art" href={`/challenge/${challenge.slug}`} aria-label={`Explore ${challenge.title}`}><Image className="challenge-card-image" src={challenge.imageUrl||'/og-great-signal.svg'} alt="" width={661} height={793} unoptimized/></Link><div className="challenge-info"><p className="challenge-index">SIGNAL 0{index+1}</p><h3><Link href={`/challenge/${challenge.slug}`}>{challenge.title}</Link></h3><p>{challenge.shortDescription}</p><Link className="card-link" href={`/challenge/${challenge.slug}`}>Explore challenge <span>↗</span></Link></div></article>)}</div>{status==='error'&&<p className="campaign-data-notice" role="status">The live star count is temporarily unavailable. Challenge instructions remain available.</p>}</>:<div className="empty-challenges" id="challenge-status" role="status"><span className="empty-spark">✦</span><div><h3>The challenges are temporarily unavailable.</h3><p>Challenge instructions will be shown here when campaign data is available. No participation is recorded by this page.</p><Link className="card-link" href={OFFICIAL_IOS_STORE_URL} target="_blank" rel="noreferrer">Discover ROAMA Kids on the App Store ↗</Link></div><span className="empty-tag">CHECK BACK SOON</span></div>}</section>
    <section className="how-section" id="how"><div className="how-title"><p className="eyebrow">SIMPLE AS THAT</p><h2>One adventure.<br/><em>One little light.</em></h2></div><div className="steps">{[['01','Choose any one challenge','Pick one of the three activities; there is no need to complete all three.'],['02','Try it offline together','Follow the safety guidance. No app, photo, video or public post is required.'],['03','Keep sharing optional','Enjoy the activity privately or invite another family to try it.'],['04','Star claims are paused','The verified-adult counter is separate from a count of participating children.']].map(([number,title,copy])=><div className="step" key={number}><span className="step-number">{number}</span><div><h3>{title}</h3><p>{copy}</p></div><span className="step-star">✦</span></div>)}</div></section>
    <section className="milestone-section"><div><p className="eyebrow">A SKY WE BUILD TOGETHER</p><h2>Every star takes<br/>us somewhere new.</h2><p className="milestone-copy">A million is our destination. The milestones along the way will open new chapters of the quest.</p><Link className="text-link" href="/stars">Find your place in the sky →</Link></div><div className="milestone-list">{(data.milestones?.length?data.milestones:[100,1000,10000,100000,1000000]).map((raw,index)=>{
      const milestone=typeof raw==='number'?{threshold:raw,label:index===4?'THE GREAT SIGNAL':'STARS'}:raw;
      return <div className={`milestone ${count!==null&&count>=milestone.threshold?'reached':''}`} key={milestone.threshold}><span className="milestone-star">✦</span><span className="milestone-number">{milestone.threshold.toLocaleString('en-US')}</span><span className="milestone-label">{milestone.label}</span><span className="milestone-status">{count!==null&&count>=milestone.threshold?'REACHED':'AHEAD'}</span></div>;
    })}</div></section>
    <section className="bridge-section" id="about"><div className="bridge-orbit"><div className="bridge-core"><Image src="/roama-logo.webp" alt="ROAMA Kids official logo" width={96} height={96} unoptimized/><svg className="bridge-core-star" viewBox="0 0 100 100" aria-hidden="true"><path d="m50 4 12 31 34 2-26 22 9 33-29-18-29 18 9-33L4 37l34-2z"/></svg></div><svg className="bridge-star b1" viewBox="0 0 100 100" aria-hidden="true"><path d="m50 4 12 31 34 2-26 22 9 33-29-18-29 18 9-33L4 37l34-2z"/></svg><svg className="bridge-star b2" viewBox="0 0 100 100" aria-hidden="true"><path d="m50 4 12 31 34 2-26 22 9 33-29-18-29 18 9-33L4 37l34-2z"/></svg><svg className="bridge-star b3" viewBox="0 0 100 100" aria-hidden="true"><path d="m50 4 12 31 34 2-26 22 9 33-29-18-29 18 9-33L4 37l34-2z"/></svg></div><div className="bridge-copy"><p className="eyebrow">MEET ROAMA KIDS</p><h2>Your discovery<br/>is just the <em>beginning.</em></h2><p>Discover real-world adventures with Pip in ROAMA Kids. Follow your curiosity, then put the screen down and explore together.</p><div className="store-actions"><a className="store-button" href={ios} target="_blank" rel="noreferrer" onClick={()=>trackStoreClick('ios')}><span>Download on the<br/><b>App Store ↗</b></span></a>{android&&<a className="store-button" href={android} target="_blank" rel="noreferrer" onClick={()=>trackStoreClick('android')}><span>Find it on<br/><b>Google Play ↗</b></span></a>}</div><p><a className="text-link" href={OFFICIAL_SITE_URL} target="_blank" rel="noreferrer">Visit the official ROAMA Kids website ↗</a></p><p className="bridge-foot">The quest is for everyone. No app download needed to take part.</p></div></section>
    <section className="closing"><div className="closing-stars" aria-hidden="true"><svg viewBox="0 0 100 100"><path d="m50 4 12 31 34 2-26 22 9 33-29-18-29 18 9-33L4 37l34-2z"/></svg><span>·</span><svg viewBox="0 0 100 100"><path d="m50 4 12 31 34 2-26 22 9 33-29-18-29 18 9-33L4 37l34-2z"/></svg><span>·</span><svg viewBox="0 0 100 100"><path d="m50 4 12 31 34 2-26 22 9 33-29-18-29 18 9-33L4 37l34-2z"/></svg></div><p className="eyebrow">THE WORLD IS FULL OF SIGNALS</p><h2>One little light.</h2><p>Star claims are paused while privacy and participant counting are finalized. Complete any challenge privately.</p><a className="button button-gold" href="#challenges">Choose any challenge <span>↘</span></a></section>
    <footer><Brand/><span>THE GREAT SIGNAL QUEST · ONE WORLD, A MILLION STORIES</span><div><Link href="/stars">Our million-star sky</Link><a href={OFFICIAL_SITE_URL} target="_blank" rel="noreferrer">roama.tech ↗</a><Link href="/privacy">Privacy information</Link></div></footer>
  </main>;
}
