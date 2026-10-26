import Quest from '@/components/Quest';
import type {Metadata} from 'next';
import {prisma} from '@/lib/prisma';
import type {Campaign} from '@/components/Quest';
import {STAR_CAPACITY} from '@/lib/stars';
import {campaignChallenges,mergeCampaignChallenges} from '@/lib/challenge-content';
import {OFFICIAL_IOS_STORE_URL} from '@/lib/brand';
import {getCanonicalOrigin} from '@/lib/site-url';
import {serializeJsonLd} from '@/lib/json-ld';
export const dynamic='force-dynamic';
const homeTitle='ROAMA Signal Quest | Creative Challenges for Kids & Families';
const homeDescription='Try three free, screen-free family challenges for kids ages 6–12: play with shadows, explore tiny details and test simple balance ideas at home. No app needed.';
export async function generateMetadata():Promise<Metadata>{
 const origin=getCanonicalOrigin();
 let socialImage='/og-great-signal.png';
 try{
  const config=await prisma.campaignConfig.findUnique({where:{id:1}});
  if(config?.published&&config.socialImageUrl)socialImage=config.socialImageUrl;
 }catch(error){
  console.error('Homepage metadata override unavailable.',error instanceof Error?error.name:'UnknownError');
 }
 return {
  title:homeTitle,
  description:homeDescription,
  alternates:{canonical:origin},
  openGraph:{
   title:homeTitle,
   description:homeDescription,
   type:'website',
   url:origin,
   images:[socialImage==='/og-great-signal.png'
    ?{url:socialImage,width:1200,height:630,alt:'ROAMA Signal Quest — a million stars and three creative family challenges.'}
    :{url:socialImage,alt:'ROAMA Signal Quest campaign preview.'}],
  },
  twitter:{card:'summary_large_image',title:homeTitle,description:homeDescription,images:[socialImage]},
 };
}

async function initialCampaign():Promise<Campaign>{try{const [count,c,overrides]=await Promise.all([prisma.completion.count({where:{status:'ACCEPTED',emailVerifiedAt:{not:null}}}),prisma.campaignConfig.findUnique({where:{id:1}}),prisma.challenge.findMany({where:{status:'PUBLISHED',slug:{in:campaignChallenges.map(challenge=>challenge.slug)}},select:{slug:true,title:true,shortDescription:true,description:true,instructions:true,safety:true,duration:true,imageUrl:true}})]);const live=c?.published??false;return {configured:true,count,goal:STAR_CAPACITY,title:live?c?.title:'The Great Signal Quest',headline:live?c?.headline:'A million stars. One global quest.',description:live?c?.description:'Three real-world challenges. Infinite ways to surprise yourself. Choose any one and try it with your family. Participation is private by default; no app download is needed.',milestones:(c?.milestones as Campaign['milestones'])||[],iosStoreUrl:(live&&c?.iosStoreUrl)||OFFICIAL_IOS_STORE_URL,androidStoreUrl:live?c?.androidStoreUrl:null,challenges:mergeCampaignChallenges(overrides)};}catch(error){console.error('Campaign data request failed.',error instanceof Error?error.name:'UnknownError');return {configured:false,count:null,goal:STAR_CAPACITY,iosStoreUrl:OFFICIAL_IOS_STORE_URL,androidStoreUrl:null,challenges:[...campaignChallenges],error:'The live star count is temporarily unavailable.'};}}
export default async function Home() {
 const origin=getCanonicalOrigin();
 const structuredData={
  '@context':'https://schema.org',
  '@graph':[
   {'@type':'WebSite','@id':`${origin}/#website`,url:origin,name:'ROAMA Signal Quest',inLanguage:'en'},
   {'@type':'WebPage','@id':`${origin}/#webpage`,url:origin,name:homeTitle,description:homeDescription,inLanguage:'en',isPartOf:{'@id':`${origin}/#website`}},
  ],
 };
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd(structuredData)}}/><Quest initialData={await initialCampaign()}/></>;
}
