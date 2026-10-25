'use client';

import {useCallback,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import Brand from '@/components/Brand';
import StarCardActions from '@/components/StarCardActions';
import {OFFICIAL_IOS_STORE_URL,OFFICIAL_SITE_URL} from '@/lib/brand';
import {trackStoreClick} from '@/lib/client-analytics';
import {
  STAR_CAPACITY,STAR_COLUMNS,STAR_ROWS,STAR_SPACING,STAR_WORLD_SIZE,
  STAR_TILE_COUNT,STAR_TILE_SIZE,buildStarPixels,isStarNumber,starPosition,starTile,
  type PublicStar,type StarOverview,
} from '@/lib/stars';

type Camera={x:number;y:number;zoom:number};
type Size={width:number;height:number};
type TileEntry={stars:PublicStar[];loadedAt:number};
const centered:Camera={x:STAR_WORLD_SIZE/2,y:STAR_WORLD_SIZE/2,zoom:1};
const MAX_CACHED_TILES=32;
const MAX_ZOOM=128;

function scaleFor(size:Size,camera:Camera) {
  return Math.max(0.001,Math.min(size.width-32,size.height-32)/STAR_WORLD_SIZE)*camera.zoom;
}

function boundCamera(camera:Camera,size:Size):Camera {
  const zoom=Math.max(1,Math.min(MAX_ZOOM,camera.zoom));
  const scale=scaleFor(size,{...camera,zoom});
  const halfWidth=Math.min(STAR_WORLD_SIZE/2,size.width/scale/2);
  const halfHeight=Math.min(STAR_WORLD_SIZE/2,size.height/scale/2);
  return {x:Math.max(halfWidth,Math.min(STAR_WORLD_SIZE-halfWidth,camera.x)),y:Math.max(halfHeight,Math.min(STAR_WORLD_SIZE-halfHeight,camera.y)),zoom};
}

async function readJSON<T>(url:string,signal?:AbortSignal):Promise<T> {
  const response=await fetch(url,{signal,cache:'no-store'});
  if(!response.ok)throw new Error('The star map could not connect. Please try again.');
  return response.json();
}

export default function StarMap() {
  const container=useRef<HTMLDivElement>(null);
  const canvas=useRef<HTMLCanvasElement>(null);
  const texture=useRef<HTMLCanvasElement|null>(null);
  const tiles=useRef(new Map<string,TileEntry>());
  const initialized=useRef(false);
  const drag=useRef<{x:number;y:number;camera:Camera;moved:boolean}|null>(null);
  const [size,setSize]=useState<Size>({width:0,height:0});
  const [camera,setCamera]=useState<Camera>(centered);
  const [overview,setOverview]=useState<StarOverview|null>(null);
  const [selected,setSelected]=useState<number|null>(null);
  const [find,setFind]=useState('');
  const [error,setError]=useState('');
  const [regionError,setRegionError]=useState('');
  const [shareStatus,setShareStatus]=useState('');
  const [tileSnapshot,setTileSnapshot]=useState<Map<string,TileEntry>>(()=>new Map());
  const [retry,setRetry]=useState(0);
  const scale=scaleFor(size,camera);

  useEffect(()=>{
    const controller=new AbortController();
    const load=async()=>{
      try {
        const data=await readJSON<StarOverview>('/api/stars',controller.signal);
        setOverview(data);
        setError('');
      } catch(error) {
        if(controller.signal.aborted)return;
        setError(error instanceof Error?error.message:'The star map could not connect.');
      }
    };
    void load();
    const timer=window.setInterval(()=>void load(),30000);
    return ()=>{controller.abort();clearInterval(timer);};
  },[retry]);

  useEffect(()=>{
    if(!container.current)return;
    const background=document.createElement('canvas');
    background.width=STAR_COLUMNS*2;
    background.height=STAR_ROWS*2;
    const context=background.getContext('2d');
    if(!context)return;
    context.putImageData(new ImageData(buildStarPixels(),background.width,background.height),0,0);
    texture.current=background;
    const observer=new ResizeObserver(([entry])=>{
      setSize({width:entry.contentRect.width,height:entry.contentRect.height});
      if(!initialized.current){
        initialized.current=true;
        const number=Number(new URLSearchParams(window.location.search).get('star'));
        if(isStarNumber(number)){
          const position=starPosition(number);
          setCamera(boundCamera({...position,zoom:64},{width:entry.contentRect.width,height:entry.contentRect.height}));
          setSelected(number);
          setFind(String(number));
        }
      }else setCamera(current=>boundCamera(current,{width:entry.contentRect.width,height:entry.contentRect.height}));
    });
    observer.observe(container.current);
    return ()=>{observer.disconnect();texture.current=null;background.width=0;background.height=0;};
  },[]);

  const visibleTiles:string[]=[];
  if(size.width&&scale>=0.6){
    const tileWorldSize=STAR_TILE_SIZE*STAR_SPACING;
    const firstX=Math.max(0,Math.floor((camera.x-size.width/scale/2)/tileWorldSize));
    const lastX=Math.min(STAR_TILE_COUNT-1,Math.floor((camera.x+size.width/scale/2)/tileWorldSize));
    const firstY=Math.max(0,Math.floor((camera.y-size.height/scale/2)/tileWorldSize));
    const lastY=Math.min(STAR_TILE_COUNT-1,Math.floor((camera.y+size.height/scale/2)/tileWorldSize));
    for(let y=firstY;y<=lastY;y++)for(let x=firstX;x<=lastX;x++)visibleTiles.push(`${x}:${y}`);
  }
  if(selected){
    const {tileX,tileY}=starTile(selected);
    const key=`${tileX}:${tileY}`;
    if(!visibleTiles.includes(key))visibleTiles.push(key);
  }
  const tileKeys=visibleTiles.join(',');

  useEffect(()=>{
    const controller=new AbortController();
    const keys=tileKeys?tileKeys.split(','):[];
    const load=async()=>{
      try {
        // Fetch at most four regions simultaneously, never the whole million-row sky.
        for(let start=0;start<keys.length;start+=4){
          await Promise.all(keys.slice(start,start+4).map(async key=>{
            const cached=tiles.current.get(key);
            if(cached&&Date.now()-cached.loadedAt<15000){
              tiles.current.delete(key);
              tiles.current.set(key,cached);
              return;
            }
            const [tileX,tileY]=key.split(':');
            const data=await readJSON<{stars:PublicStar[]}>(`/api/stars?tileX=${tileX}&tileY=${tileY}`,controller.signal);
            tiles.current.delete(key);
            tiles.current.set(key,{stars:data.stars,loadedAt:Date.now()});
            while(tiles.current.size>MAX_CACHED_TILES){
              const oldest=tiles.current.keys().next().value;
              if(oldest===undefined)break;
              tiles.current.delete(oldest);
            }
          }));
        }
        if(!controller.signal.aborted){
          setTileSnapshot(new Map(tiles.current));
          setRegionError('');
        }
      } catch(error) {
        if(!controller.signal.aborted)setRegionError(error instanceof Error?error.message:'This region could not load.');
      }
    };
    void load();
    return ()=>controller.abort();
  },[tileKeys,retry,overview]);

  useEffect(()=>{
    const element=canvas.current;
    const context=element?.getContext('2d');
    if(!element||!context||!texture.current||!size.width)return;
    const ratio=Math.min(window.devicePixelRatio||1,2);
    element.width=Math.round(size.width*ratio);
    element.height=Math.round(size.height*ratio);
    context.setTransform(ratio,0,0,ratio,0,0);
    context.clearRect(0,0,size.width,size.height);
    const left=size.width/2-camera.x*scale;
    const top=size.height/2-camera.y*scale;
    if(scale<0.6){
      context.imageSmoothingEnabled=true;
      context.globalAlpha=scale<0.1?0.2:0.8;
      context.drawImage(texture.current,left,top,STAR_WORLD_SIZE*scale,STAR_WORLD_SIZE*scale);
      context.globalAlpha=1;
      if(scale<0.1){
        // Enlarge a stable subset of actual positions that otherwise fall below one screen pixel.
        let seed=0x5eed;
        context.fillStyle='rgba(164,185,210,0.4)';
        context.beginPath();
        for(let index=0;index<5000;index++){
          seed=(Math.imul(seed,1664525)+1013904223)>>>0;
          const position=starPosition(seed%STAR_CAPACITY+1);
          const x=left+position.x*scale,y=top+position.y*scale,radius=0.3+(seed>>>24)/255*0.55;
          context.moveTo(x+radius,y);
          context.arc(x,y,radius,0,Math.PI*2);
        }
        context.fill();
      }
    }else{
      const firstColumn=Math.max(0,Math.floor((camera.x-size.width/scale/2)/STAR_SPACING));
      const lastColumn=Math.min(STAR_COLUMNS-1,Math.floor((camera.x+size.width/scale/2)/STAR_SPACING));
      const firstRow=Math.max(0,Math.floor((camera.y-size.height/scale/2)/STAR_SPACING));
      const lastRow=Math.min(STAR_ROWS-1,Math.floor((camera.y+size.height/scale/2)/STAR_SPACING));
      context.fillStyle='rgba(164,185,210,0.48)';
      context.beginPath();
      for(let row=firstRow;row<=lastRow;row++)for(let column=firstColumn;column<=lastColumn;column++){
        const number=row*STAR_COLUMNS+column+1;
        const position=starPosition(number);
        const x=left+position.x*scale,y=top+position.y*scale,radius=0.5+(number%3)*0.25;
        context.moveTo(x+radius,y);
        context.arc(x,y,radius,0,Math.PI*2);
      }
      context.fill();
    }

    if(overview&&scale<0.6){
      for(const tile of overview.tiles){
        const x=left+(tile.tileX+0.5)*STAR_TILE_SIZE*STAR_SPACING*scale;
        const y=top+(tile.tileY+0.5)*STAR_TILE_SIZE*STAR_SPACING*scale;
        const radius=Math.max(3,Math.min(16,Math.sqrt(tile.count)*0.8));
        const glow=context.createRadialGradient(x,y,0,x,y,radius);
        glow.addColorStop(0,'rgba(231,195,116,0.8)');
        glow.addColorStop(1,'rgba(231,195,116,0)');
        context.fillStyle=glow;
        context.fillRect(x-radius,y-radius,radius*2,radius*2);
      }
    }
    const lit=new Map<number,PublicStar>();
    for(const star of overview?.recent||[])lit.set(star.starNumber,star);
    if(scale>=0.6)for(const key of tileKeys.split(',')){
      for(const star of tileSnapshot.get(key)?.stars||[])lit.set(star.starNumber,star);
    }
    context.fillStyle='#ffe3a0';
    for(const star of lit.values()){
      const position=starPosition(star.starNumber);
      const x=left+position.x*scale,y=top+position.y*scale;
      if(x<0||x>size.width||y<0||y>size.height)continue;
      const radius=Math.max(1.1,Math.min(3.5,scale));
      context.beginPath();
      context.arc(x,y,radius,0,Math.PI*2);
      context.fill();
      if(scale>=1){
        context.fillRect(x-radius*3,y-0.5,radius*6,1);
        context.fillRect(x-0.5,y-radius*3,1,radius*6);
      }
    }
    if(selected){
      const position=starPosition(selected);
      const x=left+position.x*scale,y=top+position.y*scale;
      context.strokeStyle='#f5f0e6';
      context.lineWidth=1.5;
      context.beginPath();
      context.arc(x,y,Math.max(10,scale*2),0,Math.PI*2);
      context.stroke();
    }
  },[camera,size,scale,overview,selected,tileSnapshot,tileKeys]);

  const zoomAt=useCallback((factor:number,x?:number,y?:number)=>{
    setCamera(current=>{
      const before=scaleFor(size,current);
      const zoom=Math.max(1,Math.min(MAX_ZOOM,current.zoom*factor));
      const after=scaleFor(size,{...current,zoom});
      const dx=(x??size.width/2)-size.width/2;
      const dy=(y??size.height/2)-size.height/2;
      return boundCamera({x:current.x+dx/before-dx/after,y:current.y+dy/before-dy/after,zoom},size);
    });
  },[size]);

  useEffect(()=>{
    const element=canvas.current;
    if(!element)return;
    const wheel=(event:WheelEvent)=>{
      event.preventDefault();
      const rect=element.getBoundingClientRect();
      zoomAt(Math.exp(-event.deltaY*0.002),event.clientX-rect.left,event.clientY-rect.top);
    };
    element.addEventListener('wheel',wheel,{passive:false});
    return ()=>element.removeEventListener('wheel',wheel);
  },[zoomAt]);

  function locate(number:number) {
    if(!isStarNumber(number)){setRegionError('Enter a star number from 1 to 1,000,000.');return;}
    setSelected(number);
    setCamera(boundCamera({...starPosition(number),zoom:64},size));
    setFind(String(number));
    setRegionError('');
    window.history.replaceState(null,'',`/stars?star=${number}`);
  }

  const selectedTile=selected?starTile(selected):null;
  const selectedEntry=selectedTile?tileSnapshot.get(`${selectedTile.tileX}:${selectedTile.tileY}`):undefined;
  const selectedStar=selectedEntry?.stars.find(star=>star.starNumber===selected)||overview?.recent.find(star=>star.starNumber===selected);

  return <main className="star-page">
    <header className="star-header"><Brand/><nav><Link href="/#challenges">The challenge</Link><a href={OFFICIAL_SITE_URL} target="_blank" rel="noreferrer">Meet ROAMA Kids ↗</a><a className="nav-cta" href={OFFICIAL_IOS_STORE_URL} target="_blank" rel="noreferrer" onClick={()=>trackStoreClick('ios')}>App Store ↗</a></nav></header>
    <section className="star-intro"><div><p className="eyebrow">ONE WORLD · ONE MILLION PLACES TO SHINE</p><h1>A sky we build <em>together.</em></h1><p>Every bright star is a real, adult-confirmed discovery. The quiet ones are waiting for a new adventure.</p></div><div className="star-total" aria-live="polite"><strong>{overview?overview.count.toLocaleString('en-US'):'—'}</strong><span> / 1,000,000 stars lit</span></div></section>
    <section className="star-explorer" aria-label="One million star explorer">
      <div className="star-map-toolbar"><span><i className="lit-dot"/> Verified adult stars <i className="dim-dot"/> Awaiting a claim</span><div><button aria-label="Zoom out" onClick={()=>zoomAt(0.5)}>−</button><output aria-label="Zoom level">{camera.zoom.toFixed(camera.zoom<10?1:0)}×</output><button aria-label="Zoom in" onClick={()=>zoomAt(2)}>+</button><button onClick={()=>{setCamera(centered);setSelected(null);window.history.replaceState(null,'','/stars');}}>View all</button></div></div>
      <div className="star-canvas-wrap" ref={container}>
        <canvas ref={canvas} className="star-canvas" tabIndex={0} role="img" aria-label="A map of exactly one million star positions. Use the zoom buttons, drag to explore, or find a star by number." data-slot-count={STAR_CAPACITY}
          onKeyDown={event=>{
            if(event.key==='+'||event.key==='='){event.preventDefault();zoomAt(2);}
            else if(event.key==='-'){event.preventDefault();zoomAt(0.5);}
            else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
              event.preventDefault();
              setCamera(current=>boundCamera({...current,x:current.x+(event.key==='ArrowLeft'?-1:event.key==='ArrowRight'?1:0)*100/scale,y:current.y+(event.key==='ArrowUp'?-1:event.key==='ArrowDown'?1:0)*100/scale},size));
            }
          }}
          onPointerDown={event=>{event.currentTarget.setPointerCapture(event.pointerId);drag.current={x:event.clientX,y:event.clientY,camera,moved:false};}}
          onPointerMove={event=>{
            if(!drag.current)return;
            const dx=event.clientX-drag.current.x,dy=event.clientY-drag.current.y;
            if(Math.hypot(dx,dy)>5)drag.current.moved=true;
            setCamera(boundCamera({...drag.current.camera,x:drag.current.camera.x-dx/scale,y:drag.current.camera.y-dy/scale},size));
          }}
          onPointerCancel={()=>{drag.current=null;}}
          onPointerUp={event=>{
            const active=drag.current;
            drag.current=null;
            if(!active||active.moved)return;
            const rect=event.currentTarget.getBoundingClientRect();
            const x=camera.x+(event.clientX-rect.left-size.width/2)/scale;
            const y=camera.y+(event.clientY-rect.top-size.height/2)/scale;
            if(x<0||y<0||x>=STAR_WORLD_SIZE||y>=STAR_WORLD_SIZE)return;
            locate(Math.floor(y/STAR_SPACING)*STAR_COLUMNS+Math.floor(x/STAR_SPACING)+1);
          }}/>
        <p className="star-map-hint">{scale<0.6?'One million stars. Zoom in to explore individual discoveries.':'Drag to explore. Select a star to read its name.'}</p>
      </div>
      <div className="star-map-bottom"><form onSubmit={event=>{event.preventDefault();locate(Number(find));}}><label htmlFor="find-star">Find a star</label><input id="find-star" type="number" min="1" max={STAR_CAPACITY} placeholder="Star number" value={find} onChange={event=>setFind(event.target.value)} required/><button className="button button-gold">Find ↗</button></form><p>1,000 columns × 1,000 rows. Every star has its own permanent number.</p></div>
      {(error||regionError)&&<div className="star-map-error" role="alert"><p>{error||regionError}</p><button className="share-button" onClick={()=>setRetry(value=>value+1)}>Try again</button></div>}
    </section>
    {selected&&<section className="selected-star" aria-live="polite"><span className="selected-star-icon" aria-hidden="true">✦</span><div><p className="eyebrow">STAR #{selected.toLocaleString('en-US')}</p><h2>{selectedStar?selectedStar.starName||'A discovery without a name':selectedEntry?'Your next discovery could shine here.':'Connecting to this part of the sky…'}</h2><p>{selectedStar?'One permanent star in the ROAMA Signal Quest.':selectedEntry?'This star has not been claimed.': 'Names load only for the part of the sky you explore.'}</p></div>{selectedStar?<StarCardActions starNumber={selected} starName={selectedStar.starName} onStatus={setShareStatus}/>:<Link className="button button-gold" href="/#challenges">Choose a challenge ↗</Link>}
      {selectedStar&&<button className="share-button" onClick={async()=>{
      try {await navigator.clipboard.writeText(`${window.location.origin}/stars?star=${selected}`);setShareStatus('Star link copied.');}
      catch(error){console.warn('Star link could not be copied.',error);setRegionError('Copy the star link from your browser address bar.');}
    }}>Copy star link</button>}</section>}
    {shareStatus&&<p className="star-share-status" role="status">{shareStatus}</p>}
    <section className="star-next"><div><p className="eyebrow">A REAL DISCOVERY. A LITTLE LIGHT.</p><h2>What will your star be called?</h2><p>Choose a challenge, explore safely with an adult, and give your star a made-up name. No child account needed.</p></div><Link className="button button-gold" href="/#challenges">Start an adventure ↗</Link></section>
    <footer className="star-footer"><Brand/><a href={OFFICIAL_SITE_URL} target="_blank" rel="noreferrer">Official ROAMA Kids website ↗</a><Link href="/privacy">Privacy information</Link></footer>
  </main>;
}
