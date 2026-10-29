'use client';

import {useCallback,useEffect,useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Brand from '@/components/Brand';
import {OFFICIAL_SITE_URL} from '@/lib/brand';
import {trackEvent} from '@/lib/client-analytics';
import {appendAttribution,currentAttribution} from '@/lib/attribution';
import AppDownloadCTA from '@/components/AppDownloadCTA';
import {useLanguage} from '@/components/FunnelPreferences';
import {FAMILY_CHALLENGE_MESSAGE,localizedPath} from '@/lib/funnel';
import {turkishChallenges} from '@/lib/challenge-translations';

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
  const language=useLanguage();
  const tr=language==='tr';
  const headline=data.headline||'A MILLION STARS. ONE GLOBAL QUEST.';
  const headlineSentences=headline.match(/^(.+?[.!?])\s+(.+)$/);
  const challengePresentation:Record<string,{title:string;defaultTitle:string;description:string;defaultDescription:string;alt:string;accent:string}>={
    'shadow-signal':{title:'SHADOW SIGNAL',defaultTitle:'The Shadow Signal',description:'Discover the magic of light and shadows.',defaultDescription:'Can you make something ordinary look impossible?',alt:'A child uses a small light to cast a playful creature-shaped shadow on a wall.',accent:'violet'},
    'micro-world-safari':{title:'MICRO-WORLD SAFARI',defaultTitle:'The Micro-World Safari',description:'Explore the tiny wonders around you.',defaultDescription:'What if you looked a little closer?',alt:'A child looks through a magnifying glass at the detailed veins of a green leaf.',accent:'green'},
    'gravity-defier':{title:'GRAVITY DEFIER',defaultTitle:'The Gravity Defier',description:'Experiment, discover, and challenge gravity.',defaultDescription:'Can you balance three objects in a way that looks impossible?',alt:'A child carefully balances light household objects in a surprising stack.',accent:'blue'},
  };

  useEffect(()=>{
    trackEvent('page_view');
  },[]);

  useEffect(()=>{
    const section=document.querySelector('.star-journey');
    if(!section)return;
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){
        section.classList.add('is-visible');
        observer.disconnect();
      }
    },{threshold:.2});
    observer.observe(section);
    return ()=>observer.disconnect();
  },[]);

  function preserveChallengeAttribution(event:React.MouseEvent<HTMLElement>) {
    if(!(event.target instanceof Element))return;
    const link=event.target.closest<HTMLAnchorElement>('a[href^="/challenge/"]');
    const slug=link?.getAttribute('href')?.split('?')[0].split('/').pop();
    if(!link||!slug)return;
    link.href=appendAttribution(localizedPath(`/challenge/${slug}`,language),currentAttribution());
  }

  return <main>
    <header className="topbar">
      <Brand href={localizedPath('/',language)}/>
      <nav aria-label="Main navigation">
        <a href="#top">The Quest</a>
        <a href="#challenges">Challenges</a>
        <a href="#how">How It Works</a>
        <a href="#parents">For Parents</a>
      </nav>
      <div className="topbar-actions">
        <AppDownloadCTA compact/>
        <a className="nav-cta nav-cta-join" href="#challenges">{tr?'Görev seç':'Join the Quest'} <span>↗</span></a>
      </div>
    </header>
    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow-dot"/> ROAMA KIDS PRESENTS · {(data.title||'THE GREAT SIGNAL QUEST').toUpperCase()}</p>
        <h1>{headlineSentences?<>{headlineSentences[1]}<br/><em>{headlineSentences[2]}</em></>:headline}</h1>
        <p className="hero-lede">{tr?'6–12 yaş çocuklar için üç ücretsiz, ekransız aile görevi. Uygulama, fotoğraf veya kayıt gerekmez.':FAMILY_CHALLENGE_MESSAGE}</p>
        {data.description&&data.description!==FAMILY_CHALLENGE_MESSAGE&&<p className="hero-context">{data.description}</p>}
        <div className="hero-actions"><a className="button button-gold" href="#challenges">CHOOSE YOUR ADVENTURE <span>↘</span></a><Link className="text-link" href="/stars">Explore the star map <span>→</span></Link></div>
        <p className="hero-note"><span className="tiny-star">✦</span> A million children is our mission—not a current count.</p>
      </div>
      <div className="hero-scene" role="img" aria-label="Original ROAMA challenge artwork under a glowing constellation">
        <Stars/>
        <span className="scene-star scene-star-one" aria-hidden="true">✦</span>
        <span className="scene-star scene-star-two" aria-hidden="true">✧</span>
        <div className="scene-island island-one" aria-hidden="true"/>
        <div className="scene-island island-two" aria-hidden="true"/>
        <figure className="hero-artwork hero-artwork-shadow"><Image src="/images/challenges/shadow-signal.png" alt="" width={661} height={793} priority unoptimized/></figure>
        <figure className="hero-artwork hero-artwork-micro"><Image src="/images/challenges/micro-world-safari.png" alt="" width={661} height={793} loading="lazy" unoptimized/></figure>
        <figure className="hero-artwork hero-artwork-gravity"><Image src="/images/challenges/gravity-defier.png" alt="" width={661} height={793} loading="lazy" unoptimized/></figure>
        <span className="scene-caption">REAL-WORLD CURIOSITY · ROAMA KIDS ADVENTURE</span>
      </div>
    </section>
    <section className="challenge-section" id="challenges" onClickCapture={preserveChallengeAttribution} aria-labelledby="challenge-heading">
      <div className="section-heading"><div><p className="eyebrow">{tr?'ÜÇ GÖREV · KOCAMAN BİR DÜNYA':'THREE MISSIONS · ONE BIG WORLD'}</p><h2 id="challenge-heading">{tr?'Maceranızı seçin.':'Choose your adventure.'}</h2></div><p>{tr?'6–12 yaş için. Bir görev seçin; bir yetişkinle birlikte keşfedin.':'For kids ages 6–12. Pick one mission. Explore together with your grown-up.'}</p></div>
      {data.challenges.length?<><div className="challenge-grid">{data.challenges.slice(0,3).map((challenge,index)=>{
        const presentation=challengePresentation[challenge.slug];
        if(!presentation)return null;
        const translation=tr?turkishChallenges[challenge.slug]:undefined;
        const title=translation?.title||(challenge.title===presentation.defaultTitle?presentation.title:challenge.title.replace(/^The\s+/i,'').toUpperCase());
        const description=translation?.shortDescription||(challenge.shortDescription===presentation.defaultDescription?presentation.description:challenge.shortDescription);
        return <article className={`challenge-card challenge-card-${presentation.accent}`} key={challenge.slug}>
          <a className="challenge-card-link" href={localizedPath(`/challenge/${challenge.slug}`,language)} aria-label={`${title}: ${description} ${tr?'Göreve başla':'Start challenge'}`}>
            <span className="challenge-card-image-wrap"><Image className="challenge-card-image" src={challenge.imageUrl||'/og-great-signal.svg'} alt={translation?.imageAlt||presentation.alt} width={661} height={793} unoptimized/></span>
            <span className="challenge-info"><span className="challenge-index">{tr?'GÖREV':'MISSION'} 0{index+1}</span><span className="challenge-title">{title}</span><span className="challenge-description">{description}</span><span className="card-link">{tr?'GÖREVE BAŞLA':'START CHALLENGE'} <span aria-hidden="true">↗</span></span></span>
          </a>
        </article>;
      })}</div>{status==='error'&&<p className="campaign-data-notice" role="status">The live star count is temporarily unavailable. Challenge instructions remain available.</p>}</>:<div className="empty-challenges" id="challenge-status" role="status"><span className="empty-spark">✦</span><div><h3>The challenges are temporarily unavailable.</h3><p>Challenge instructions will be shown here when campaign data is available. No participation is recorded by this page.</p><a className="card-link" href="#get-app">Discover ROAMA Kids ↗</a></div><span className="empty-tag">CHECK BACK SOON</span></div>}
    </section>
    <section className="how-section" id="how" aria-labelledby="how-heading">
      <div className="how-title"><p className="eyebrow">A LITTLE ADVENTURE GOES A LONG WAY</p><h2 id="how-heading">HOW IT<br/><em>WORKS</em></h2><p>Simple steps. Big discoveries.</p></div>
      <div className="steps">
        {[['01','CHOOSE A CHALLENGE','Pick your favorite mission and get the details.'],['02','EXPLORE THE REAL WORLD','Try the activity with your grown-up.'],['03','EARN YOUR STAR IN ROAMA KIDS','Your discovery becomes part of the adventure. An adult organizer verifies their email; the star celebrates the child’s completed challenge.']].map(([number,title,copy])=><div className="step" key={number}><span className="step-number">{number}</span><div><h3>{title}</h3><p>{copy}</p></div><span className="step-star" aria-hidden="true">✦</span></div>)}
      </div>
    </section>
    <section className="star-journey" aria-labelledby="star-journey-heading">
      <div className="journey-heading"><p className="eyebrow">A REAL-WORLD DISCOVERY, A ROAMA KIDS STORY</p><h2 id="star-journey-heading">YOUR DISCOVERY<br/><em>BECOMES A STAR</em></h2><p>Every completed challenge adds to the ROAMA Kids adventure story.</p></div>
      <div className="journey-track" aria-label="Illustration of a child completing a challenge, a star symbolizing the achievement, and that star joining a constellation">
        <article className="journey-stage"><span className="journey-art"><Image src="/images/challenges/micro-world-safari.png" alt="" width={661} height={793} loading="lazy" unoptimized/></span><span className="journey-step-label">01 · DISCOVER</span><h3>Explore beyond the screen.</h3></article>
        <span className="journey-connector" aria-hidden="true">→</span>
        <article className="journey-stage journey-stage-star"><span className="journey-star" aria-hidden="true">✦</span><span className="journey-step-label">02 · CELEBRATE</span><h3>A star marks the achievement.</h3></article>
        <span className="journey-connector" aria-hidden="true">→</span>
        <article className="journey-stage journey-stage-sky"><span className="journey-constellation" aria-hidden="true"><i/><i/><i/><i/><i/></span><span className="journey-step-label">03 · BELONG</span><h3>Join the ROAMA Kids universe.</h3></article>
      </div>
      <p className="journey-disclaimer">A visual story—not a live reward or activity tracker.</p>
    </section>
    <section className="counter-section" aria-labelledby="counter-title">
      <div className="counter-intro"><p className="eyebrow">OUR SHARED JOURNEY</p><h2 id="counter-title">Every discovery<br/>leaves a little light.</h2><p>Only completed challenges with a verified adult organizer email are counted as permanent stars.</p><Link className="counter-map-link" href="/stars">See the million-star sky ↗</Link></div>
      <div className="counter-card"><div className="counter-head"><span>VERIFIED ADULT STAR CLAIMS</span><span className="live"><i/> LIVE COUNT</span></div><div className="count-line" aria-live="polite" aria-atomic="true"><strong>{count===null?'—':count.toLocaleString('en-US')}</strong><span>/ {data.goal.toLocaleString('en-US')} stars</span></div>{count!==null?<div className="progress-track" role="progressbar" aria-label="Verified adult-email star claims toward the campaign target" aria-valuemin={0} aria-valuemax={data.goal} aria-valuenow={Math.min(count,data.goal)}><span style={{width:`${progress}%`}}/></div>:<div className="counter-unavailable" aria-hidden="true"/>}<div className="progress-label"><span>{status==='error'?'The live count is temporarily unavailable':`${progress.toFixed(progress<1?2:1)}% OF OUR GOAL`}</span><span>{data.goal.toLocaleString('en-US')}</span></div>{status==='error'&&<button className="retry" onClick={()=>void refresh()}>Try again</button>}<div className="mini-constellation" aria-hidden="true">{Array.from({length:28},(_,index)=><span key={index} style={{left:`${(index*37+9)%97}%`,top:`${(index*23+14)%80}%`,opacity:index<litStars?0.78:0.08}}/>)}<div className="mini-message">A constellation<br/>in the making.</div></div><p className="count-foot">One permanent star per verified adult email. No visits or unverified submissions are counted.</p></div>
    </section>
    <section className="parent-section" id="parents" aria-labelledby="parents-heading">
      <div className="parent-visual"><Image src="/roama-logo.webp" alt="Official ROAMA Kids fox logo" width={192} height={192} unoptimized/><span className="parent-visual-star" aria-hidden="true">✦</span><span className="parent-visual-caption">CURIOUS TOGETHER</span></div>
      <div className="parent-copy"><p className="eyebrow">A NOTE FOR GROWN-UPS</p><h2 id="parents-heading">ADVENTURES TO<br/><em>EXPLORE TOGETHER</em></h2><p>ROAMA Signal Quest encourages children ages 6–12 to explore the world around them through simple, real-world activities.</p><ul><li>Everyday materials and accessible activities.</li><li>Adult support and supervision during challenges.</li><li>Curiosity, creativity, and discovery.</li><li>A thoughtful balance between app adventures and real-world exploration.</li></ul><div className="parent-actions"><a className="button button-gold" href="#get-app">{tr?'ROAMA Kids uygulamasını keşfet':'DISCOVER THE ROAMA KIDS APP'} ↗</a><Link className="text-link" href="/privacy">Privacy information <span>→</span></Link></div><p className="bridge-foot">No app download, photo, video or public post is needed to join a challenge.</p></div>
    </section>
    <section className="home-app-section" id="get-app" aria-labelledby="get-app-heading">
      <p className="eyebrow">ROAMA KIDS · {tr?'6–12 yaş':'ages 6–12'}</p>
      <h2 id="get-app-heading">{tr?'Maceraya uygulamada devam edin.':'Continue the adventure in the app.'}</h2>
      <p>{tr?'Ücretsiz görevler için uygulama veya kayıt gerekmez. Daha fazlasını keşfetmek isterseniz cihazınıza uygun seçeneği kullanın.':'The free challenges need no app or sign-up. If you want to explore more, choose the option for your device.'}</p>
      <AppDownloadCTA/>
      <p className="app-trust">{tr?'%100 Çocuk Dostu • Reklamsız • Herkese Açık Sohbet Yok • 6–12 yaş':'100% Kid-Safe • No Ads • No Public Chat • Ages 6–12'}</p>
    </section>
    <section className="global-mission" aria-labelledby="global-mission-heading">
      <div className="mission-constellation" aria-hidden="true"><svg viewBox="0 0 360 260"><circle cx="180" cy="130" r="95"/><ellipse cx="180" cy="130" rx="42" ry="95"/><path d="M86 130h188M105 83q75 43 150 0M105 177q75-43 150 0M73 198l52-58 52 24 61-87 50 42"/></svg><span className="mission-star mission-star-a">✦</span><span className="mission-star mission-star-b">✦</span><span className="mission-star mission-star-c">✦</span></div>
      <div className="mission-copy"><p className="eyebrow">A BRIGHTER, MORE CURIOUS TOMORROW</p><h2 id="global-mission-heading">HELP US INSPIRE<br/><em>ONE MILLION CHILDREN</em></h2><p>Together, we can encourage children everywhere to explore, experiment, and discover beyond the screen.</p><p className="mission-slogan">A MILLION STARS. ONE GLOBAL QUEST.</p><a className="button button-gold" href="#challenges">CHOOSE YOUR CHALLENGE <span>↗</span></a></div>
    </section>
    <section className="milestone-section"><div><p className="eyebrow">A SKY WE BUILD TOGETHER</p><h2>Every star takes<br/>us somewhere new.</h2><p className="milestone-copy">A million is our destination. The milestones along the way will open new chapters of the quest.</p><Link className="text-link" href="/stars">Find your place in the sky →</Link></div><div className="milestone-list">{(data.milestones?.length?data.milestones:[100,1000,10000,100000,1000000]).map((raw,index)=>{
      const milestone=typeof raw==='number'?{threshold:raw,label:index===4?'THE GREAT SIGNAL':'STARS'}:raw;
      return <div className={`milestone ${count!==null&&count>=milestone.threshold?'reached':''}`} key={milestone.threshold}><span className="milestone-star">✦</span><span className="milestone-number">{milestone.threshold.toLocaleString('en-US')}</span><span className="milestone-label">{milestone.label}</span><span className="milestone-status">{count!==null&&count>=milestone.threshold?'REACHED':'AHEAD'}</span></div>;
    })}</div></section>
    <footer><Brand href={localizedPath('/',language)}/><span>ROAMA SIGNAL QUEST · A MILLION STARS. ONE GLOBAL QUEST.</span><div><Link href={localizedPath('/stars',language)}>Explore the star map</Link><a href={OFFICIAL_SITE_URL} target="_blank" rel="noreferrer">roama.tech ↗</a><Link href="/privacy">Privacy information</Link></div></footer>
  </main>;
}
