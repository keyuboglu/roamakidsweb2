'use client';

import {useState} from 'react';
import {attributionFields,currentAttribution,trackedChallengeUrl,type Attribution} from '@/lib/attribution';
import {useLanguage} from '@/components/FunnelPreferences';
import {localizedPath} from '@/lib/funnel';
import {containImage,RIDDLE_CARD_FORMATS,type RiddleCardFormat} from '@/lib/riddle-cards';
import {shareFileOrLink} from '@/lib/share-card';

type CardCopy={hook:string;supporting:string;hookInArtwork?:boolean};
type Props={slug:string;imageUrl:string;copy:CardCopy};

function track(event:'star_card_downloaded'|'star_card_shared'|'share',slug:string,target:string,attribution:Attribution) {
  void fetch('/api/events',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    keepalive:true,
    body:JSON.stringify({event,slug,target,...attributionFields(attribution)}),
  }).catch(error=>console.warn('Challenge-card analytics unavailable.',error));
}

function wrapText(context:CanvasRenderingContext2D,text:string,maxWidth:number) {
  const words=text.split(/\s+/);
  const lines:string[]=[];
  let line='';
  for(const word of words){
    const candidate=line?`${line} ${word}`:word;
    if(line&&context.measureText(candidate).width>maxWidth){
      lines.push(line);
      line=word;
    }else line=candidate;
  }
  if(line)lines.push(line);
  return lines;
}

function drawStars(context:CanvasRenderingContext2D,width:number,height:number) {
  context.fillStyle='#0b1426';
  context.fillRect(0,0,width,height);
  for(let index=0;index<54;index++){
    const x=(index*193+71)%(width-56)+28;
    const y=(index*127+37)%(height-56)+28;
    const radius=index%7===0?2.2:1.2;
    context.globalAlpha=index%3===0?.75:.28;
    context.fillStyle=index%5===0?'#e7c374':'#f5f0e6';
    context.beginPath();
    context.arc(x,y,radius,0,Math.PI*2);
    context.fill();
  }
  context.globalAlpha=1;
}

function fitImage(context:CanvasRenderingContext2D,image:HTMLImageElement,x:number,y:number,width:number,height:number) {
  const rect=containImage(image.naturalWidth,image.naturalHeight,x,y,width,height);
  context.drawImage(image,rect.x,rect.y,rect.width,rect.height);
}

function drawCopy(context:CanvasRenderingContext2D,copy:CardCopy,x:number,y:number,maxWidth:number,scale:number) {
  context.fillStyle='#f5f0e6';
  context.font=`600 ${Math.round(36*scale)}px Georgia, "Times New Roman", serif`;
  const hookLines=copy.hookInArtwork?[]:wrapText(context,copy.hook,maxWidth);
  const hookLineHeight=45*scale;
  hookLines.forEach((line,index)=>context.fillText(line,x,y+index*hookLineHeight,maxWidth));
  const supportY=copy.hookInArtwork?y:y+hookLines.length*hookLineHeight+20*scale;
  context.fillStyle='#d5dce7';
  context.font=`${Math.round(18*scale)}px Arial, sans-serif`;
  const supportLines=wrapText(context,copy.supporting,maxWidth);
  supportLines.forEach((line,index)=>context.fillText(line,x,supportY+index*26*scale,maxWidth));
}

function renderCard(image:HTMLImageElement,format:RiddleCardFormat,copy:CardCopy,slug:string) {
  const {width,height}=RIDDLE_CARD_FORMATS[format];
  const canvas=document.createElement('canvas');
  canvas.width=width;
  canvas.height=height;
  const context=canvas.getContext('2d');
  if(!context)throw new Error('Card export is unavailable in this browser.');
  drawStars(context,width,height);
  context.strokeStyle='rgba(231,195,116,.55)';
  context.lineWidth=2;
  context.strokeRect(18,18,width-36,height-36);
  if(format==='landscape'){
    context.fillStyle='#101d34';
    context.fillRect(34,34,470,height-68);
    fitImage(context,image,52,48,434,height-96);
    context.fillStyle='#e7c374';
    context.font='700 18px Arial, sans-serif';
    context.letterSpacing='3px';
    context.fillText('ROAMA SIGNAL QUEST',548,94,590);
    context.fillStyle='#f5f0e6';
    context.font='17px Arial, sans-serif';
    context.letterSpacing='2px';
    context.fillText('THE GREAT SIGNAL QUEST',548,126,590);
    context.letterSpacing='0px';
    drawCopy(context,copy,548,206,590,1);
    context.fillStyle='#e7c374';
    context.font='700 17px Arial, sans-serif';
    context.fillText('TRY THE FREE CHALLENGE',548,492,590);
    context.fillStyle='#d5dce7';
    context.font='14px Arial, sans-serif';
    context.fillText(`signalquest.roama.tech/challenge/${slug}`,548,532,590);
  }else{
    context.fillStyle='#e7c374';
    context.font='700 24px Arial, sans-serif';
    context.letterSpacing='4px';
    context.textAlign='center';
    context.fillText('ROAMA SIGNAL QUEST',width/2,104,width-120);
    context.fillStyle='#d5dce7';
    context.font='18px Arial, sans-serif';
    context.letterSpacing='3px';
    context.fillText('THE GREAT SIGNAL QUEST',width/2,142,width-120);
    context.letterSpacing='0px';
    context.fillStyle='#101d34';
    context.fillRect(60,176,width-120,1030);
    fitImage(context,image,80,196,width-160,990);
    context.textAlign='center';
    context.fillStyle='#f5f0e6';
    context.font='600 54px Georgia, "Times New Roman", serif';
    const hookLines=copy.hookInArtwork?[]:wrapText(context,copy.hook,width-160);
    hookLines.forEach((line,index)=>context.fillText(line,width/2,1320+index*70,width-160));
    context.fillStyle='#d5dce7';
    context.font='24px Arial, sans-serif';
    const supportLines=wrapText(context,copy.supporting,width-160);
    const supportY=copy.hookInArtwork?1320:1480;
    supportLines.forEach((line,index)=>context.fillText(line,width/2,supportY+index*38,width-160));
    context.fillStyle='#e7c374';
    context.font='700 25px Arial, sans-serif';
    context.fillText('TRY THE FREE CHALLENGE',width/2,1670,width-160);
    context.fillStyle='#d5dce7';
    context.font='17px Arial, sans-serif';
    context.fillText(`signalquest.roama.tech/challenge/${slug}`,width/2,1730,width-160);
    context.textAlign='start';
  }
  return new Promise<Blob>((resolve,reject)=>{
    canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('The riddle card could not be saved.')),'image/png');
  });
}

async function loadArtwork(imageUrl:string) {
  const response=await fetch(imageUrl,{cache:'force-cache'});
  if(!response.ok)throw new Error('The original challenge artwork could not be loaded.');
  const imageBlob=await response.blob();
  const objectUrl=URL.createObjectURL(imageBlob);
  const image=new Image();
  try{
    await new Promise<void>((resolve,reject)=>{
      image.onload=()=>resolve();
      image.onerror=()=>reject(new Error('The original challenge artwork could not be decoded.'));
      image.src=objectUrl;
    });
    return image;
  }catch(error){
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

async function createCard(imageUrl:string,format:RiddleCardFormat,copy:CardCopy,slug:string) {
  const image=await loadArtwork(imageUrl);
  try{
    return await renderCard(image,format,copy,slug);
  }finally{
    URL.revokeObjectURL(image.src);
  }
}

function downloadBlob(blob:Blob,filename:string) {
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement('a');
  anchor.href=url;
  anchor.download=filename;
  anchor.click();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export default function RiddleCardActions({slug,imageUrl,copy}:Props) {
  const language=useLanguage();
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  const [trackedUrl,setTrackedUrl]=useState('');

  function invitationUrl() {
    if(trackedUrl)return trackedUrl;
    const url=trackedChallengeUrl(localizedPath(`/challenge/${slug}`,language),currentAttribution(),slug);
    setTrackedUrl(url);
    return url;
  }

  async function download(format:RiddleCardFormat) {
    setBusy(true);
    setNotice('');
    try{
      const blob=await createCard(imageUrl,format,copy,slug);
      downloadBlob(blob,`roama-${slug}-riddle-card-${RIDDLE_CARD_FORMATS[format].width}x${RIDDLE_CARD_FORMATS[format].height}.png`);
      track('star_card_downloaded',slug,format,currentAttribution());
      setNotice(`Your ${RIDDLE_CARD_FORMATS[format].label} is ready to download.`);
    }catch(error){
      setNotice(error instanceof Error?error.message:'The riddle card could not be downloaded. Please try again.');
    }finally{
      setBusy(false);
    }
  }

  async function share() {
    setBusy(true);
    setNotice('');
    const attribution=currentAttribution();
    try{
      const url=invitationUrl();
      const blob=await createCard(imageUrl,'landscape',copy,slug);
      const file=new File([blob],`roama-${slug}-riddle-card-1200x630.png`,{type:'image/png'});
      const payload={title:'ROAMA Signal Quest',text:copy.hook,url:`${window.location.origin}${url}`};
      if(typeof navigator.share==='function'){
        const shared=await shareFileOrLink(file,payload,navigator.share.bind(navigator),navigator.canShare?.bind(navigator));
        if(shared==='file'){
          track('star_card_shared',slug,'card_file',attribution);
          setNotice('The riddle card and tracked challenge link were shared.');
        }else{
          track('share',slug,'challenge_link_share',attribution);
          setNotice('The tracked challenge link was shared. This browser could not attach the card image.');
        }
      }else if(navigator.clipboard?.writeText){
        await navigator.clipboard.writeText(payload.url);
        track('share',slug,'challenge_link_copy',attribution);
        setNotice('Image sharing is unavailable here; the tracked challenge link was copied instead.');
      }else{
        setNotice('Sharing and clipboard access are unavailable. Download a card or copy the challenge URL from your address bar.');
      }
    }catch(error){
      if(error instanceof DOMException&&error.name==='AbortError')return;
      setNotice(error instanceof Error?error.message:'The riddle card could not be shared. Try downloading it instead.');
    }finally{
      setBusy(false);
    }
  }

  async function copyLink() {
    setNotice('');
    try{
      const url=invitationUrl();
      await navigator.clipboard.writeText(`${window.location.origin}${url}`);
      track('share',slug,'challenge_link_copy',currentAttribution());
      setNotice('Tracked challenge link copied.');
    }catch(error){
      setNotice(error instanceof Error?error.message:'The link could not be copied in this browser.');
    }
  }

  return <section className="riddle-card-tools" aria-labelledby={`riddle-card-title-${slug}`}>
    <h2 id={`riddle-card-title-${slug}`}>Take the riddle with you</h2>
    <p>Share the original challenge artwork with a curiosity-first prompt. The image keeps its full composition and does not reveal a solution.</p>
    <div className="riddle-card-actions">
      <button className="share-button" disabled={busy} onClick={()=>void download('landscape')} aria-label="Download landscape riddle card, 1200 by 630 pixels">{busy?'Preparing…':'Download landscape card · 1200 × 630'}</button>
      <button className="share-button" disabled={busy} onClick={()=>void download('story')} aria-label="Download vertical story riddle card, 1080 by 1920 pixels">{busy?'Preparing…':'Download story card · 1080 × 1920'}</button>
      <button className="share-button" disabled={busy} onClick={()=>void share()} aria-label="Share riddle card and tracked challenge link">Share card ↗</button>
      <button className="share-button" disabled={busy} onClick={()=>void copyLink()} aria-label="Copy tracked challenge link">Copy challenge link</button>
    </div>
    {notice&&<p className="riddle-card-notice" role="status">{notice}</p>}
  </section>;
}
