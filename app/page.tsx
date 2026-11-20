import Quest from '@/components/Quest';
import type {Metadata} from 'next';
import type {Campaign} from '@/components/Quest';
import {STAR_CAPACITY} from '@/lib/stars';
import {verifiedStarCountWithin} from '@/lib/verified-stars';
import {campaignChallenges} from '@/lib/challenge-content';
import {getCanonicalOrigin} from '@/lib/site-url';
import {serializeJsonLd} from '@/lib/json-ld';
import {FAMILY_CHALLENGE_MESSAGE} from '@/lib/funnel';
import {serverLanguage,languageAlternates} from '@/lib/server-language';
export const dynamic='force-dynamic';
const homeTitle='ROAMA Kids · Signal Quest | Creative Challenges for Kids & Families';
const homeDescription=FAMILY_CHALLENGE_MESSAGE;
export async function generateMetadata():Promise<Metadata>{
 const language=await serverLanguage();
 const title=language==='tr'?'ROAMA Kids · Sinyal Görevi | Çocuklar ve Aileler İçin Yaratıcı Görevler':homeTitle;
 const description=language==='tr'?'6–12 yaş çocuklar için üç ücretsiz, uygulamasız aile görevi. Fotoğraf veya kayıt gerekmez.':homeDescription;
 const socialImage=language==='tr'?'/og-great-signal-tr.png':'/og-great-signal.png';
 return {
  title,
  description,
  alternates:languageAlternates('',language),
  openGraph:{
   title,
   description,
   locale:language==='tr'?'tr_TR':'en_US',
   type:'website',
   url:languageAlternates('',language).canonical,
   images:[{url:socialImage,width:1200,height:630,alt:language==='tr'?'ROAMA Kids · Sinyal Görevi kampanya önizlemesi.':'ROAMA Kids · Signal Quest campaign preview.'}],
  },
  twitter:{card:'summary_large_image',title,description,images:[socialImage]},
 };
}

export default async function Home() {
 const language=await serverLanguage();
 // The first HTML already carries the verified count, so no visitor waits on "Checking verified stars…".
 const initialCampaign:Campaign={configured:false,count:await verifiedStarCountWithin(1500),goal:STAR_CAPACITY,challenges:[...campaignChallenges]};
 const tr=language==='tr';
 const origin=getCanonicalOrigin();
 const structuredData={
  '@context':'https://schema.org',
  '@graph':[
   {'@type':'WebSite','@id':`${origin}/#website`,url:origin,name:tr?'ROAMA Kids · Sinyal Görevi':'ROAMA Kids · Signal Quest',inLanguage:language},
   {'@type':'WebPage','@id':`${origin}/#webpage`,url:languageAlternates('',language).canonical,name:tr?'ROAMA Kids · Sinyal Görevi | Yaratıcı Aile Görevleri':homeTitle,description:tr?'6–12 yaş çocuklar için üç ücretsiz, uygulamasız aile görevi. Fotoğraf veya kayıt gerekmez.':homeDescription,inLanguage:language,isPartOf:{'@id':`${origin}/#website`}},
  ],
 };
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd(structuredData)}}/><Quest initialData={initialCampaign}/></>;
}
