'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Brand from '@/components/Brand';
import CompletionForm from '@/components/CompletionForm';
import RiddleCardActions from '@/components/RiddleCardActions';
import AppBridge from '@/components/AppBridge';
import {useLanguage} from '@/components/FunnelPreferences';
import {localizedPath} from '@/lib/funnel';
import {turkishChallenges} from '@/lib/challenge-translations';
import {trackEvent} from '@/lib/client-analytics';
import {challengeArtwork} from '@/lib/challenge-content';
import {RIDDLE_CARD_COPY} from '@/lib/riddle-cards';

type Challenge={
  slug:string;
  title:string;
  shortDescription:string;
  description:string;
  instructions:string;
  safety:string;
  duration:string|null;
  estimatedTime:string;
  materials:string;
  ageGuidance:{ages6to8:string;ages9to12:string};
  whyInteresting:string;
  optionalSharingPrompt:string;
  imageAlt:string;
  imageUrl:string|null;
};

export default function ChallengeDetail({challenge:original,verificationEnabled}:{challenge:Challenge;verificationEnabled:boolean}) {
  const language=useLanguage();
  const tr=language==='tr';
  const challenge={...original,...(tr?turkishChallenges[original.slug]:{})};
  const [started,setStarted]=useState(false);
  const [completed,setCompleted]=useState(false);
  const t=(en:string,turkish:string)=>tr?turkish:en;
  const instructionLines=challenge.instructions.split('\n').filter(Boolean);
  const steps=instructionLines.filter(line=>/^\d+\.\s/.test(line));
  const notes=instructionLines.filter(line=>!/^\d+\.\s/.test(line));
  const imageUrl=challengeArtwork(challenge.slug,challenge.imageUrl)||'/og-great-signal.svg';
  const cardCopy=RIDDLE_CARD_COPY[challenge.slug]||null;

  useEffect(()=>trackEvent('challenge_view',{slug:challenge.slug}),[challenge.slug]);

  function start() {
    if(!started)trackEvent('challenge_start',{slug:challenge.slug});
    setStarted(true);
  }

  function complete() {
    if(completed)return;
    start();
    trackEvent('challenge_complete',{slug:challenge.slug});
    setCompleted(true);
  }

  return <main className="detail-page">
    <div className="detail-brand-row"><Brand href={localizedPath('/',language)}/><Link className="text-link" href={localizedPath('/stars',language)}>{t('Explore a million stars','Bir milyon yıldızı keşfet')} ↗</Link></div>
    <Link href={localizedPath('/',language)} className="detail-back">← The Great Signal Quest</Link>
    <p className="eyebrow">{t('CHOOSE ANY ONE CHALLENGE · ages 6–12','İSTEDİĞİNİZ BİR GÖREVİ SEÇİN · 6–12 yaş')} {challenge.duration&&`· ${challenge.duration}`}</p>
    <h1>{challenge.title}</h1><p className="detail-lede">{challenge.shortDescription}</p>
    <a className="button button-gold" href="#challenge-steps" onClick={start}>{started?t('Continue challenge','Göreve devam et'):t('Start challenge','Göreve başla')} ↓</a>
    <Image className="detail-art" src={imageUrl} alt={challenge.imageAlt} width={661} height={793} loading="eager" unoptimized/>
    {challenge.description&&<section><h2>{t('Discover','Keşfedin')}</h2><p>{challenge.description}</p></section>}
    <section className="challenge-facts"><h2>{t('Time and materials','Süre ve malzemeler')}</h2><dl><div><dt>{t('Time','Süre')}</dt><dd>{challenge.estimatedTime}</dd></div><div><dt>{t('Materials','Malzemeler')}</dt><dd>{challenge.materials}</dd></div></dl></section>
    <section id="challenge-steps"><h2>{t('Your challenge','Göreviniz')}</h2>{steps.length>0?<ol className="challenge-instructions">{steps.map(step=><li key={step}>{step.replace(/^\d+\.\s/,'')}</li>)}</ol>:<p>{challenge.instructions}</p>}{notes.map(note=><p className="challenge-note" key={note}>{note}</p>)}</section>
    <section><h2>{t('Make it a good fit · ages 6–12','Çocuğunuza uygun hale getirin · 6–12 yaş')}</h2><p><strong>{t('For younger explorers:','Küçük kaşifler için:')}</strong> {challenge.ageGuidance.ages6to8}</p><p><strong>{t('For older explorers:','Büyük kaşifler için:')}</strong> {challenge.ageGuidance.ages9to12}</p><p className="challenge-interest">{challenge.whyInteresting}</p></section>
    {challenge.safety&&<section><h2>{t('Stay safe','Güvende kalın')}</h2><p>{challenge.safety}</p></section>}
    <section><h2>{t('Invite another family (optional)','Başka bir aileyi davet edin (isteğe bağlı)')}</h2><p>{challenge.optionalSharingPrompt}</p><p>{t('No photo, public post or app is needed. Sharing is always optional and adult-controlled.','Fotoğraf, herkese açık paylaşım veya uygulama gerekmez. Paylaşım her zaman isteğe bağlıdır ve bir yetişkinin kontrolündedir.')}</p></section>
    {cardCopy&&<RiddleCardActions slug={challenge.slug} imageUrl={imageUrl} copy={cardCopy}/>}
    <section className="detail-complete"><h2>{t('Completed this challenge?','Görevi tamamladınız mı?')}</h2><p>{t('Participation is private by default. No app download, photo, video or sign-up is required. By confirming below, an adult organizer reports that the activity was completed safely.','Katılım varsayılan olarak gizlidir. Uygulama, fotoğraf, video veya kayıt gerekmez. Aşağıda onay veren yetişkin, etkinliğin güvenle tamamlandığını bildirir.')}</p>
      <button className="button button-gold" onClick={complete} disabled={completed}>{completed?t('Challenge completed!','Görev tamamlandı!'):t('Our family completed this challenge','Ailece bu görevi tamamladık')}</button>
    </section>
    {completed&&<><AppBridge slug={challenge.slug}/><section className="detail-complete"><h2>{t('Claim a star (optional)','Yıldızınızı alın (isteğe bağlı)')}</h2><p>{t('Only an adult email verification creates a permanent web star. This is separate from the Android launch list.','Kalıcı web yıldızı yalnızca yetişkin e-posta doğrulamasıyla oluşturulur. Android lansman listesinden ayrıdır.')}</p><CompletionForm challengeSlug={challenge.slug} verificationEnabled={verificationEnabled}/></section></>}
    <p><Link className="text-link" href={localizedPath('/#challenges',language)}>← {t('Return to the challenges','Görevlere dön')}</Link></p>
  </main>;
}
