import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {emailVerificationConfigured} from '@/lib/email-verification';
import {campaignChallenges,mergeCampaignChallenges} from '@/lib/challenge-content';
import {prisma} from '@/lib/prisma';
import {getCanonicalOrigin} from '@/lib/site-url';
import {serializeJsonLd} from '@/lib/json-ld';
import ChallengeDetail from '@/components/ChallengeDetail';
import {serverLanguage,languageAlternates} from '@/lib/server-language';
import {turkishChallenges} from '@/lib/challenge-translations';
export const dynamic='force-dynamic';
async function getChallenge(slug:string){const base=campaignChallenges.find(challenge=>challenge.slug===slug);if(!base)return null;try{const override=await prisma.challenge.findFirst({where:{slug,status:'PUBLISHED'},select:{slug:true,title:true,shortDescription:true,description:true,instructions:true,safety:true,duration:true,imageUrl:true}});return override?mergeCampaignChallenges([override]).find(challenge=>challenge.slug===slug)||base:base;}catch(error){console.error('Challenge content override unavailable.',error instanceof Error?error.name:'UnknownError');return base;}}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params;
 const language=await serverLanguage();
 const translation=language==='tr'?turkishChallenges[slug]:undefined;
 const challenge=await getChallenge(slug);
 if(!challenge)return {title:language==='tr'?'Görev bulunamadı':'Challenge not found',robots:{index:false,follow:false}};
 const canonical=languageAlternates(`/challenge/${slug}`,language).canonical;
 const image=challenge.imageUrl||'/og-great-signal.png';
 const title=`${translation?.title||challenge.title} | ${language==='tr'?'ROAMA Sinyal Macerası':'ROAMA Signal Quest'}`;
 const description=translation?`${translation.description} 6–12 yaş çocuklar ve aileler için ücretsiz, ekransız bir görev. Uygulama, fotoğraf veya kayıt gerekmez.`:challenge.seoDescription;
 return {
  title,
  description,
  alternates:languageAlternates(`/challenge/${slug}`,language),
  openGraph:{
   title,
   description,
   type:'article',
   url:canonical,
   locale:language==='tr'?'tr_TR':'en_US',
   images:[{url:image,width:661,height:793,alt:translation?.imageAlt||challenge.imageAlt}],
  },
  twitter:{card:'summary_large_image',title,description,images:[image]},
 };
}
export default async function ChallengePage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const language=await serverLanguage();
 const challenge=await getChallenge(slug);
 if(!challenge)notFound();
 const origin=getCanonicalOrigin();
 const canonical=languageAlternates(`/challenge/${slug}`,language).canonical;
 const copy=language==='tr'?{...challenge,...turkishChallenges[slug]}:challenge;
 const image=`${origin}${challenge.imageUrl||'/og-great-signal.png'}`;
 const structuredData={
  '@context':'https://schema.org',
  '@graph':[
   {'@type':'WebSite','@id':`${origin}/#website`,url:origin,name:language==='tr'?'ROAMA Sinyal Macerası':'ROAMA Signal Quest',inLanguage:language},
   {
    '@type':'WebPage',
    '@id':`${canonical}#webpage`,
    url:canonical,
    name:`${copy.title} | ${language==='tr'?'ROAMA Sinyal Macerası':'ROAMA Signal Quest'}`,
    description:language==='tr'?copy.description:challenge.seoDescription,
    inLanguage:language,
    isPartOf:{'@id':`${origin}/#website`},
    primaryImageOfPage:{'@type':'ImageObject',url:image,width:661,height:793,caption:copy.imageAlt},
    breadcrumb:{'@id':`${canonical}#breadcrumb`},
   },
   {
    '@type':'BreadcrumbList',
    '@id':`${canonical}#breadcrumb`,
    itemListElement:[
     {'@type':'ListItem',position:1,name:language==='tr'?'ROAMA Sinyal Macerası':'ROAMA Signal Quest',item:origin},
     {'@type':'ListItem',position:2,name:copy.title,item:canonical},
    ],
   },
  ],
 };
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd(structuredData)}}/><ChallengeDetail challenge={challenge} verificationEnabled={emailVerificationConfigured()}/></>;
}
