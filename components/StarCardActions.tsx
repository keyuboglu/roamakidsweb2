'use client';

import {useState} from 'react';
import Link from 'next/link';
import {trackEvent} from '@/lib/client-analytics';
import {appendAttribution,currentAttribution,type Attribution} from '@/lib/attribution';
import {shareFileOrLink} from '@/lib/share-card';
import {useLanguage} from '@/components/FunnelPreferences';
import {localizedPath,type Language} from '@/lib/funnel';

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

function svgMarkup(starNumber:number,starName:string|null,publicUrl:string,language:Language) {
  const tr=language==='tr';
  const twinkles=Array.from({length:45},(_,index)=>{
    const x=(index*193+71)%1120+40;
    const y=(index*127+37)%510+50;
    const size=1.4+(index%4)*0.65;
    return `<circle cx="${x}" cy="${y}" r="${size}" fill="#f5f0e6" opacity="${index%3===0?'.8':'.32'}"/>`;
  }).join('');
  const title=escapeXml(starName||(tr?'İsimsiz bir keşif':'A discovery without a name'));
  const number=String(starNumber).padStart(6,'0');
  const nameSize=Math.max(25,Math.min(43,Math.floor(1300/title.length)));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs><radialGradient id="sky"><stop stop-color="#172844"/><stop offset="1" stop-color="#09111f"/></radialGradient><radialGradient id="glow"><stop stop-color="#f5d994" stop-opacity=".42"/><stop offset="1" stop-color="#f5d994" stop-opacity="0"/></radialGradient></defs>
  <rect width="${WIDTH}" height="${HEIGHT}" rx="28" fill="url(#sky)"/><circle cx="600" cy="250" r="220" fill="url(#glow)"/>${twinkles}
  <text x="600" y="69" text-anchor="middle" fill="#f5f0e6" font-family="Arial,sans-serif" font-size="16" letter-spacing="5">${tr?'ROAMA SİNYAL MACERASI':'ROAMA SIGNAL QUEST'}</text>
  <text x="600" y="98" text-anchor="middle" fill="#b6c2d3" font-family="Arial,sans-serif" font-size="12" letter-spacing="4">${tr?'BÜYÜK SİNYAL MACERASI':'THE GREAT SIGNAL QUEST'}</text>
  <path d="m600 115 24 72 75 2-59 47 21 72-61-42-61 42 21-72-59-47 75-2z" fill="#e7c374"/>
  <text x="600" y="398" text-anchor="middle" fill="#e7c374" font-family="Arial,sans-serif" font-size="23" letter-spacing="5">${tr?'YILDIZ':'STAR'} #${number}</text>
  <text x="600" y="463" text-anchor="middle" fill="#f5f0e6" font-family="Georgia,serif" font-size="${nameSize}">${title}</text>
  <text x="600" y="535" text-anchor="middle" fill="#b6c2d3" font-family="Arial,sans-serif" font-size="18" letter-spacing="2">${tr?'TEK DÜNYA · PARLAMAK İÇİN BİR MİLYON YER':'ONE WORLD · ONE MILLION PLACES TO SHINE'}</text>
  <text x="600" y="588" text-anchor="middle" fill="#b6c2d3" font-family="Arial,sans-serif" font-size="13">${escapeXml(publicUrl)}</text>
  </svg>`;
}

async function imageFile(starNumber:number,starName:string|null,language:Language) {
  const publicUrl=`${window.location.origin}${localizedPath(`/stars?star=${starNumber}`,language)}`;
  const svg=new Blob([svgMarkup(starNumber,starName,publicUrl,language)],{type:'image/svg+xml'});
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

function track(event:'star_card_downloaded'|'star_card_shared'|'share',attribution:Attribution|undefined,target?:string) {
  trackEvent(event,{target},attribution);
}

export default function StarCardActions({starNumber,starName,onStatus,attribution}:{starNumber:number;starName:string|null;onStatus:(message:string)=>void;attribution?:Attribution}) {
  const language=useLanguage();
  const tr=language==='tr';
  const t=(en:string,turkish:string)=>tr?turkish:en;
  const [busy,setBusy]=useState(false);
  const publicStarUrl=appendAttribution(localizedPath(`/stars?star=${starNumber}`,language),attribution||{});

  async function download() {
    setBusy(true);
    try {
      const file=await imageFile(starNumber,starName,language);
      const url=URL.createObjectURL(file);
      const anchor=document.createElement('a');
      anchor.href=url;
      anchor.download=file.name;
      anchor.click();
      window.setTimeout(()=>URL.revokeObjectURL(url),1000);
      track('star_card_downloaded',attribution,'landscape');
      onStatus(t('Your private-safe star card has been downloaded.','Kişisel bilgi içermeyen yıldız kartınız indirildi.'));
    } catch(error) {
      console.error('Star-card download failed.',error instanceof Error?error.name:'UnknownError');
      onStatus(tr?'Yıldız kartı indirilemedi. Lütfen tekrar deneyin.':error instanceof Error?error.message:'The star card could not be downloaded. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if(typeof navigator.share!=='function'){
      onStatus(t('Native sharing is not available in this browser. Download your star card instead.','Bu tarayıcıda doğrudan paylaşım yok. Bunun yerine yıldız kartınızı indirebilirsiniz.'));
      return;
    }
    setBusy(true);
    try {
      const file=await imageFile(starNumber,starName,language);
      const payload={title:tr?`ROAMA Sinyal Macerası yıldızım #${starNumber}`:`My ROAMA Signal Quest star #${starNumber}`,text:t('One world. One million places to shine.','Tek dünya. Parlamak için bir milyon yer.'),url:`${window.location.origin}${appendAttribution(localizedPath(`/stars?star=${starNumber}`,language),{...currentAttribution(),...attribution})}`};
      const shared=await shareFileOrLink(file,payload,navigator.share.bind(navigator),navigator.canShare?.bind(navigator));
      if(shared==='file'){
        track('star_card_shared',attribution,'card_file');
        onStatus(t('Your star card and public star link were shared.','Yıldız kartınız ve herkese açık yıldız bağlantınız paylaşıldı.'));
      }else{
        track('share',attribution,'star_link_share');
        onStatus(t('Your public star link was shared. This browser could not attach the card image.','Yıldız bağlantınız paylaşıldı. Bu tarayıcı kart görselini ekleyemedi.'));
      }
    } catch(error) {
      if(error instanceof DOMException&&error.name==='AbortError')return;
      console.error('Star-card sharing failed.',error instanceof Error?error.name:'UnknownError');
      onStatus(tr?'Yıldız kartı paylaşılamadı. Bunun yerine indirmeyi deneyin.':error instanceof Error?error.message:'This device could not share the star card. Try downloading it instead.');
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    const link=`${window.location.origin}${appendAttribution(localizedPath(`/stars?star=${starNumber}`,language),{...currentAttribution(),...attribution})}`;
    try {
      await navigator.clipboard.writeText(link);
      track('share',attribution,'star_link_copy');
      onStatus(t('Public star link copied.','Herkese açık yıldız bağlantısı kopyalandı.'));
    } catch(error) {
      console.warn('Star link could not be copied.',error instanceof Error?error.name:'UnknownError');
      onStatus(tr?`Kopyalama kullanılamıyor. Kopyalamak için bu yıldız bağlantısını açın: ${link}`:`Copy is unavailable. Open this public star link to copy it: ${link}`);
    }
  }

  return <div className="star-card-actions">
    <button className="share-button" disabled={busy} onClick={()=>void download()}>{busy?t('Preparing…','Hazırlanıyor…'):t('Download my star card ↓','Yıldız kartımı indir ↓')}</button>
    <button className="share-button" disabled={busy} onClick={()=>void share()}>{t('Share my star ↗','Yıldızımı paylaş ↗')}</button>
    <button className="share-button" onClick={()=>void copyLink()}>{t('Copy star link','Yıldız bağlantısını kopyala')}</button>
    <Link className="star-public-link" href={publicStarUrl}>{t('Open public star card','Herkese açık yıldız kartını aç')}</Link>
  </div>;
}
