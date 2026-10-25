'use client';

import {useState} from 'react';
import Link from 'next/link';

const WIDTH=1200;
const HEIGHT=630;

function escapeXml(value:string) {
  return value.replace(/[&<>"']/g,character=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&apos;',
  })[character]||character);
}

function svgMarkup(starNumber:number,starName:string|null,publicUrl:string) {
  const twinkles=Array.from({length:45},(_,index)=>{
    const x=(index*193+71)%1120+40;
    const y=(index*127+37)%510+50;
    const size=1.4+(index%4)*0.65;
    return `<circle cx="${x}" cy="${y}" r="${size}" fill="#f5f0e6" opacity="${index%3===0?'.8':'.32'}"/>`;
  }).join('');
  const title=escapeXml(starName||'A discovery without a name');
  const number=String(starNumber).padStart(6,'0');
  const nameSize=Math.max(25,Math.min(43,Math.floor(1300/title.length)));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs><radialGradient id="sky"><stop stop-color="#172844"/><stop offset="1" stop-color="#09111f"/></radialGradient><radialGradient id="glow"><stop stop-color="#f5d994" stop-opacity=".42"/><stop offset="1" stop-color="#f5d994" stop-opacity="0"/></radialGradient></defs>
  <rect width="${WIDTH}" height="${HEIGHT}" rx="28" fill="url(#sky)"/><circle cx="600" cy="250" r="220" fill="url(#glow)"/>${twinkles}
  <text x="600" y="69" text-anchor="middle" fill="#f5f0e6" font-family="Arial,sans-serif" font-size="16" letter-spacing="5">ROAMA SIGNAL QUEST</text>
  <text x="600" y="98" text-anchor="middle" fill="#b6c2d3" font-family="Arial,sans-serif" font-size="12" letter-spacing="4">THE GREAT SIGNAL QUEST</text>
  <path d="m600 115 24 72 75 2-59 47 21 72-61-42-61 42 21-72-59-47 75-2z" fill="#e7c374"/>
  <text x="600" y="398" text-anchor="middle" fill="#e7c374" font-family="Arial,sans-serif" font-size="23" letter-spacing="5">STAR #${number}</text>
  <text x="600" y="463" text-anchor="middle" fill="#f5f0e6" font-family="Georgia,serif" font-size="${nameSize}">${title}</text>
  <text x="600" y="535" text-anchor="middle" fill="#b6c2d3" font-family="Arial,sans-serif" font-size="18" letter-spacing="2">ONE WORLD · ONE MILLION PLACES TO SHINE</text>
  <text x="600" y="588" text-anchor="middle" fill="#b6c2d3" font-family="Arial,sans-serif" font-size="13">${escapeXml(publicUrl)}</text>
  </svg>`;
}

async function imageFile(starNumber:number,starName:string|null) {
  const publicUrl=`${window.location.origin}/stars?star=${starNumber}`;
  const svg=new Blob([svgMarkup(starNumber,starName,publicUrl)],{type:'image/svg+xml'});
  const image=new Image();
  const source=URL.createObjectURL(svg);
  try {
    await new Promise<void>((resolve,reject)=>{
      image.onload=()=>resolve();
      image.onerror=()=>reject(new Error('The star card could not be rendered.'));
      image.src=source;
    });
    const canvas=document.createElement('canvas');
    canvas.width=WIDTH;
    canvas.height=HEIGHT;
    const context=canvas.getContext('2d');
    if(!context)throw new Error('Image download is unavailable in this browser.');
    context.drawImage(image,0,0,WIDTH,HEIGHT);
    const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('The star card could not be saved.')),'image/png'));
    return new File([blob],`roama-star-${String(starNumber).padStart(6,'0')}.png`,{type:'image/png'});
  } finally {
    URL.revokeObjectURL(source);
  }
}

function track(event:'star_card_downloaded'|'star_card_shared') {
  void fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event})})
    .catch(error=>console.warn('Star-card analytics unavailable.',error));
}

export default function StarCardActions({starNumber,starName,onStatus}:{starNumber:number;starName:string|null;onStatus:(message:string)=>void}) {
  const [busy,setBusy]=useState(false);

  async function download() {
    setBusy(true);
    try {
      const file=await imageFile(starNumber,starName);
      const url=URL.createObjectURL(file);
      const anchor=document.createElement('a');
      anchor.href=url;
      anchor.download=file.name;
      anchor.click();
      window.setTimeout(()=>URL.revokeObjectURL(url),1000);
      track('star_card_downloaded');
      onStatus('Your private-safe star card has been downloaded.');
    } catch(error) {
      console.error('Star-card download failed.',error instanceof Error?error.name:'UnknownError');
      onStatus(error instanceof Error?error.message:'The star card could not be downloaded. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if(typeof navigator.share!=='function'){
      onStatus('Native sharing is not available in this browser. Download your star card instead.');
      return;
    }
    setBusy(true);
    try {
      const file=await imageFile(starNumber,starName);
      const payload={title:`My ROAMA Signal Quest star #${starNumber}`,text:'One world. One million places to shine.',url:`${window.location.origin}/stars?star=${starNumber}`};
      track('star_card_shared');
      if(navigator.canShare?.({files:[file]}))await navigator.share({...payload,files:[file]});
      else await navigator.share(payload);
      onStatus('Your star card is ready to share.');
    } catch(error) {
      if(error instanceof DOMException&&error.name==='AbortError')return;
      console.error('Star-card sharing failed.',error instanceof Error?error.name:'UnknownError');
      onStatus(error instanceof Error?error.message:'This device could not share the star card. Try downloading it instead.');
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    const link=`${window.location.origin}/stars?star=${starNumber}`;
    try {
      await navigator.clipboard.writeText(link);
      onStatus('Public star link copied.');
    } catch(error) {
      console.warn('Star link could not be copied.',error instanceof Error?error.name:'UnknownError');
      onStatus(`Copy is unavailable. Open this public star link to copy it: ${link}`);
    }
  }

  return <div className="star-card-actions">
    <button className="share-button" disabled={busy} onClick={()=>void download()}>{busy?'Preparing…':'Download my star card ↓'}</button>
    <button className="share-button" disabled={busy} onClick={()=>void share()}>Share my star ↗</button>
    <button className="share-button" onClick={()=>void copyLink()}>Copy star link</button>
    <Link className="star-public-link" href={`/stars?star=${starNumber}`}>Open public star card</Link>
  </div>;
}
