import Quest from '@/components/Quest';
import type {Metadata} from 'next';
import {prisma} from '@/lib/prisma';
import type {Campaign} from '@/components/Quest';
import {STAR_CAPACITY} from '@/lib/stars';
import {campaignChallenges,mergeCampaignChallenges} from '@/lib/challenge-content';
import {OFFICIAL_IOS_STORE_URL} from '@/lib/brand';
import {getCanonicalOrigin} from '@/lib/site-url';
import {serializeJsonLd} from '@/lib/json-ld';
import {FAMILY_CHALLENGE_MESSAGE} from '@/lib/funnel';
import {serverLanguage,languageAlternates} from '@/lib/server-language';
export const dynamic='force-dynamic';
const homeTitle='ROAMA Signal Quest | Creative Challenges for Kids & Families';
const homeDescription=FAMILY_CHALLENGE_MESSAGE;
export async function generateMetadata():Promise<Metadata>{
 const language=await serverLanguage();
 const title=language==='tr'?'ROAMA Sinyal Macerası | Çocuklar ve Aileler İçin Yaratıcı Görevler':homeTitle;
 const description=language==='tr'?'6–12 yaş çocuklar için üç ücretsiz, ekransız aile görevi. Uygulama, fotoğraf veya kayıt gerekmez.':homeDescription;
 let socialImage='/og-great-signal.png';
 try{
  const config=await prisma.campaignConfig.findUnique({where:{id:1}});
  if(config?.published&&config.socialImageUrl)socialImage=config.socialImageUrl;
 }catch(error){
  console.error('Homepage metadata override unavailable.',error instanceof Error?error.name:'UnknownError');
 }
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
   images:[socialImage==='/og-great-signal.png'
    ?{url:socialImage,width:1200,height:630,alt:language==='tr'?'ROAMA Sinyal Macerası — bir milyon yıldız ve üç yaratıcı aile görevi.':'ROAMA Signal Quest — a million stars and three creative family challenges.'}
    :{url:socialImage,alt:language==='tr'?'ROAMA Sinyal Macerası kampanya önizlemesi.':'ROAMA Signal Quest campaign preview.'}],
  },
  twitter:{card:'summary_large_image',title,description,images:[socialImage]},
 };
}

async function initialCampaign():Promise<Campaign>{try{const [count,c,overrides]=await Promise.all([prisma.completion.count({where:{status:'ACCEPTED',emailVerifiedAt:{not:null}}}),prisma.campaignConfig.findUnique({where:{id:1}}),prisma.challenge.findMany({where:{status:'PUBLISHED',slug:{in:campaignChallenges.map(challenge=>challenge.slug)}},select:{slug:true,title:true,shortDescription:true,description:true,instructions:true,safety:true,duration:true,imageUrl:true}})]);const live=c?.published??false;return {configured:true,count,goal:STAR_CAPACITY,title:live?c?.title:'The Great Signal Quest',headline:live?c?.headline:'A MILLION STARS. ONE GLOBAL QUEST.',description:live?c?.description:'Explore the real world, complete a challenge, and earn your star in the ROAMA Kids universe.',milestones:(c?.milestones as Campaign['milestones'])||[],iosStoreUrl:(live&&c?.iosStoreUrl)||OFFICIAL_IOS_STORE_URL,androidStoreUrl:live?c?.androidStoreUrl:null,challenges:mergeCampaignChallenges(overrides)};}catch(error){console.error('Campaign data request failed.',error instanceof Error?error.name:'UnknownError');return {configured:false,count:null,goal:STAR_CAPACITY,iosStoreUrl:OFFICIAL_IOS_STORE_URL,androidStoreUrl:null,challenges:[...campaignChallenges],error:'The live star count is temporarily unavailable.'};}}
export default async function Home() {
 const language=await serverLanguage();
 const tr=language==='tr';
 const origin=getCanonicalOrigin();
 const structuredData={
  '@context':'https://schema.org',
  '@graph':[
   {'@type':'WebSite','@id':`${origin}/#website`,url:origin,name:tr?'ROAMA Sinyal Macerası':'ROAMA Signal Quest',inLanguage:language},
   {'@type':'WebPage','@id':`${origin}/#webpage`,url:languageAlternates('',language).canonical,name:tr?'ROAMA Sinyal Macerası | Yaratıcı Aile Görevleri':homeTitle,description:tr?'6–12 yaş çocuklar için üç ücretsiz, ekransız aile görevi. Uygulama, fotoğraf veya kayıt gerekmez.':homeDescription,inLanguage:language,isPartOf:{'@id':`${origin}/#website`}},
  ],
 };
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd(structuredData)}}/><Quest initialData={await initialCampaign()}/></>;
}
