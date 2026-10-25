'use client';

import {useCallback,useEffect,useRef,useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Brand from '@/components/Brand';
import CompletionForm from '@/components/CompletionForm';
import {OFFICIAL_IOS_STORE_URL,OFFICIAL_SITE_URL} from '@/lib/brand';

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
      setData(await response.json());
      setStatus('ready');
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
  const [selected,setSelected]=useState<Challenge|null>(null);
  const dialog=useRef<HTMLElement>(null);
  const count=data.count;
  const progress=count===null?0:Math.min(count/data.goal*100,100);
  const litStars=count===null?0:Math.round(progress/100*28);
  const headline=data.headline||'A million stars. One global quest.';
  const sentences=headline.match(/^(.+?[.!?])\s+(.+)$/);
  const ios=data.iosStoreUrl||OFFICIAL_IOS_STORE_URL;
  const android=data.androidStoreUrl;

  useEffect(()=>{
    const params=new URLSearchParams(location.search);
    void fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'page_view',source:params.get('utm_source')||undefined,medium:params.get('utm_medium')||undefined,campaign:params.get('utm_campaign')||undefined})}).catch(error=>console.warn('Page analytics unavailable.',error));
  },[]);

  useEffect(()=>{
    if(!selected)return;
    const previous=document.activeElement;
    const overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const keydown=(event:KeyboardEvent)=>{
      if(event.key==='Escape')setSelected(null);
      if(event.key!=='Tab')return;
      const controls=dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not([tabindex="-1"])');
      if(!controls?.length)return;
      const first=controls[0],last=controls[controls.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    };
    document.addEventListener('keydown',keydown);
    return ()=>{
      document.body.style.overflow=overflow;
      document.removeEventListener('keydown',keydown);
      if(previous instanceof HTMLElement)previous.focus();
    };
  },[selected]);

  return <main>
    <header className="topbar"><Brand/><nav><Link href="/stars">A million stars</Link><a href="#challenges">The challenges</a><a href={OFFICIAL_SITE_URL} target="_blank" rel="noreferrer">ROAMA Kids ↗</a></nav><a className="nav-cta" href="#challenges">Join the quest <span>↗</span></a></header>
    <section className="hero" id="top"><div className="hero-copy"><p className="eyebrow"><span className="eyebrow-dot"/> A WORLDWIDE ADVENTURE</p><h1>{sentences?<>{sentences[1]}<br/><em>{sentences[2]}</em></>:headline}</h1><p className="hero-lede">{data.description||'Complete a challenge. Add your star. Help build something bigger than a game.'}</p><div className="hero-actions"><a className="button button-gold" href="#challenges">Take the challenge <span>↗</span></a><Link className="text-link" href="/stars">Explore a million stars <span>→</span></Link></div><p className="hero-note"><span className="tiny-star">✦</span> One safe, real-world discovery at a time.</p></div><div className="hero-art"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="art-label label-top">SIGNAL 01 <span>✦</span></div><Stars/><div className="art-label label-bottom">SOMEWHERE, A NEW STORY BEGINS</div><span className="hero-coordinate">A SHARED ADVENTURE</span></div><div className="hero-index"><span>01</span><span className="index-line"/><span>{(data.title||'THE GREAT SIGNAL QUEST').toUpperCase()}</span></div></section>
    <section className="counter-section" aria-labelledby="counter-title"><div className="counter-intro"><p className="eyebrow">OUR SHARED JOURNEY</p><h2 id="counter-title">Every discovery<br/>leaves a little light.</h2><p>Each adult-confirmed challenge registration adds one star to our growing constellation.</p><Link className="counter-map-link" href="/stars">See the million-star sky ↗</Link></div><div className="counter-card"><div className="counter-head"><span>STARS IN THE QUEST</span><span className="live"><i/> LIVE COUNT</span></div><div className="count-line" aria-live="polite" aria-atomic="true"><strong>{count===null?'—':count.toLocaleString('en-US')}</strong><span>/ {data.goal.toLocaleString('en-US')} stars</span></div>{count!==null?<div className="progress-track" role="progressbar" aria-label="Registered completions toward the campaign star goal" aria-valuemin={0} aria-valuemax={data.goal} aria-valuenow={Math.min(count,data.goal)}><span style={{width:`${progress}%`}}/></div>:<div className="counter-unavailable" aria-hidden="true"/>}<div className="progress-label"><span>{status==='error'?'The live count is temporarily unavailable':`${progress.toFixed(progress<1?2:1)}% OF OUR GOAL`}</span><span>{data.goal.toLocaleString('en-US')}</span></div>{status==='error'&&<button className="retry" onClick={()=>void refresh()}>Try again</button>}<div className="mini-constellation" aria-hidden="true">{Array.from({length:28},(_,index)=><span key={index} style={{left:`${(index*37+9)%97}%`,top:`${(index*23+14)%80}%`,opacity:index<litStars?.78:.08}}/>)}<div className="mini-message">A constellation<br/>in the making.</div></div><p className="count-foot">Registered completions, confirmed by an adult organizer.</p></div></section>
    <section className="challenge-section" id="challenges"><div className="section-heading"><div><p className="eyebrow">YOUR FIRST STEP</p><h2>Pick up the signal.</h2></div><p>Small adventures. Big ways of seeing.<br/>Choose a challenge to begin.</p></div>{status==='error'?<div className="empty-challenges"><span className="empty-spark">✦</span><div><h3>Challenges could not load.</h3><p>Try again to reconnect to the quest.</p><button className="card-link" onClick={()=>void refresh()}>Try again ↻</button></div></div>:data.challenges.length?<div className="challenge-grid">{data.challenges.map((challenge,index)=><article className="challenge-card" key={challenge.slug}><div className={`challenge-art art-${index%3}`} style={challenge.imageUrl?{backgroundImage:`linear-gradient(0deg,rgba(9,18,35,.1),rgba(9,18,35,.05)),url('${challenge.imageUrl}')`}:undefined}><span className="challenge-num">SIGNAL {String(index+1).padStart(2,'0')}</span>{!challenge.imageUrl&&<span className="art-glyph">{['✦','◌','⌁'][index%3]}</span>}<span className="art-caption">{challenge.duration||'A moment of wonder'}</span></div><div className="challenge-info"><h3>{challenge.title}</h3><p>{challenge.shortDescription}</p><button className="card-link" onClick={()=>{
      setSelected(challenge);
      void fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'challenge_view',slug:challenge.slug})}).catch(error=>console.warn('Challenge analytics unavailable.',error));
    }}>Explore challenge <span>↗</span></button><Link className="challenge-url" href={`/challenge/${challenge.slug}`}>Shareable challenge page</Link></div></article>)}</div>:<div className="empty-challenges"><span className="empty-spark">✦</span><div><h3>The next signal is getting ready.</h3><p>New challenges will appear here soon. In the meantime, explore the sky waiting for your first star.</p><Link className="card-link" href="/stars">Explore the million-star sky ↗</Link></div><span className="empty-tag">CHALLENGES INCOMING</span></div>}</section>
    <section className="how-section" id="how"><div className="how-title"><p className="eyebrow">SIMPLE AS THAT</p><h2>Follow the signal.<br/><em>Pass it on.</em></h2></div><div className="steps">{[['01','Choose a challenge','Find a little adventure waiting in your world.'],['02','Explore safely','Take your time. Discover something new together.'],['03','Tell an adult','A parent, guardian, or organizer confirms the challenge.'],['04','Name your star','Choose a made-up name. Find your light in our million-star sky.']].map(([number,title,copy])=><div className="step" key={number}><span className="step-number">{number}</span><div><h3>{title}</h3><p>{copy}</p></div><span className="step-star">✦</span></div>)}</div></section>
    <section className="milestone-section"><div><p className="eyebrow">A SKY WE BUILD TOGETHER</p><h2>Every star takes<br/>us somewhere new.</h2><p className="milestone-copy">A million is our destination. The milestones along the way will open new chapters of the quest.</p><Link className="text-link" href="/stars">Find your place in the sky →</Link></div><div className="milestone-list">{(data.milestones?.length?data.milestones:[100,1000,10000,100000,1000000]).map((raw,index)=>{
      const milestone=typeof raw==='number'?{threshold:raw,label:index===4?'THE GREAT SIGNAL':'STARS'}:raw;
      return <div className={`milestone ${count!==null&&count>=milestone.threshold?'reached':''}`} key={milestone.threshold}><span className="milestone-star">✦</span><span className="milestone-number">{milestone.threshold.toLocaleString('en-US')}</span><span className="milestone-label">{milestone.label}</span><span className="milestone-status">{count!==null&&count>=milestone.threshold?'REACHED':'AHEAD'}</span></div>;
    })}</div></section>
    <section className="bridge-section" id="about"><div className="bridge-orbit"><div className="bridge-core"><Image src="/roama-mark.svg" alt="ROAMA Kids official mark" width={96} height={96}/><i>✦</i></div><span className="bridge-star b1">✦</span><span className="bridge-star b2">✦</span><span className="bridge-star b3">✧</span></div><div className="bridge-copy"><p className="eyebrow">MEET ROAMA KIDS</p><h2>Your discovery<br/>is just the <em>beginning.</em></h2><p>Discover real-world missions with Pip in ROAMA Kids. Follow your curiosity, then put the screen down and explore together.</p><div className="store-actions"><a className="store-button" href={ios} target="_blank" rel="noreferrer" onClick={()=>{
      void fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'store_click',store:'ios'})}).catch(error=>console.warn('Store analytics unavailable.',error));
    }}><span>Download on the<br/><b>App Store ↗</b></span></a>{android&&<a className="store-button" href={android} target="_blank" rel="noreferrer" onClick={()=>{
      void fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'store_click',store:'android'})}).catch(error=>console.warn('Store analytics unavailable.',error));
    }}><span>Find it on<br/><b>Google Play ↗</b></span></a>}</div><p><a className="text-link" href={OFFICIAL_SITE_URL} target="_blank" rel="noreferrer">Visit the official ROAMA Kids website ↗</a></p><p className="bridge-foot">The quest is for everyone. No app download needed to take part.</p></div></section>
    <section className="closing"><div className="closing-stars" aria-hidden="true">✦ · ✧ · ✦</div><p className="eyebrow">THE WORLD IS FULL OF SIGNALS</p><h2>Follow one.</h2><p>Somewhere out there, your next discovery is waiting.</p><Link className="button button-gold" href="/stars">Explore a million stars <span>↗</span></Link></section>
    <footer><Brand/><span>THE GREAT SIGNAL QUEST · ONE WORLD, A MILLION STORIES</span><div><Link href="/stars">Our million-star sky</Link><a href={OFFICIAL_SITE_URL} target="_blank" rel="noreferrer">roama.tech ↗</a><Link href="/privacy">Privacy information</Link></div></footer>
    {selected&&<div className="modal-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setSelected(null);}}><section ref={dialog} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="modal-close" onClick={()=>setSelected(null)} aria-label="Close">×</button><p className="eyebrow">YOUR NEXT SIGNAL</p><h2 id="modal-title">{selected.title}</h2><p className="modal-intro">{selected.shortDescription}</p>{selected.instructions&&<div className="modal-instructions">{selected.instructions}</div>}{selected.safety&&<p className="safety-note"><b>A note on safety</b><br/>{selected.safety}</p>}<CompletionForm key={selected.slug} slug={selected.slug} goal={data.goal} onSuccess={()=>void refresh()}/></section></div>}
  </main>;
}
