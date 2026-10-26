import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {emailVerificationConfigured} from '@/lib/email-verification';
import {campaignChallenges,mergeCampaignChallenges} from '@/lib/challenge-content';
import {prisma} from '@/lib/prisma';
import {getCanonicalOrigin} from '@/lib/site-url';
import {serializeJsonLd} from '@/lib/json-ld';
import ChallengeDetail from '@/components/ChallengeDetail';
export const dynamic='force-dynamic';
async function getChallenge(slug:string){const base=campaignChallenges.find(challenge=>challenge.slug===slug);if(!base)return null;try{const override=await prisma.challenge.findFirst({where:{slug,status:'PUBLISHED'},select:{slug:true,title:true,shortDescription:true,description:true,instructions:true,safety:true,duration:true,imageUrl:true}});return override?mergeCampaignChallenges([override]).find(challenge=>challenge.slug===slug)||base:base;}catch(error){console.error('Challenge content override unavailable.',error instanceof Error?error.name:'UnknownError');return base;}}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params;
 const challenge=await getChallenge(slug);
 if(!challenge)return {title:'Challenge not found',robots:{index:false,follow:false}};
 const origin=getCanonicalOrigin();
 const canonical=`${origin}/challenge/${slug}`;
 const image=challenge.imageUrl||'/og-great-signal.png';
 const title=`${challenge.title} | ROAMA Signal Quest`;
 const description=challenge.seoDescription;
 return {
  title,
  description,
  alternates:{canonical},
  openGraph:{
   title,
   description,
   type:'article',
   url:canonical,
   images:[{url:image,width:661,height:793,alt:challenge.imageAlt}],
  },
  twitter:{card:'summary_large_image',title,description,images:[image]},
 };
}
export default async function ChallengePage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const challenge=await getChallenge(slug);
 if(!challenge)notFound();
 const origin=getCanonicalOrigin();
 const canonical=`${origin}/challenge/${slug}`;
 const image=`${origin}${challenge.imageUrl||'/og-great-signal.png'}`;
 const structuredData={
  '@context':'https://schema.org',
  '@graph':[
   {'@type':'WebSite','@id':`${origin}/#website`,url:origin,name:'ROAMA Signal Quest',inLanguage:'en'},
   {
    '@type':'WebPage',
    '@id':`${canonical}#webpage`,
    url:canonical,
    name:`${challenge.title} | ROAMA Signal Quest`,
    description:challenge.seoDescription,
    inLanguage:'en',
    isPartOf:{'@id':`${origin}/#website`},
    primaryImageOfPage:{'@type':'ImageObject',url:image,width:661,height:793,caption:challenge.imageAlt},
    breadcrumb:{'@id':`${canonical}#breadcrumb`},
   },
   {
    '@type':'BreadcrumbList',
    '@id':`${canonical}#breadcrumb`,
    itemListElement:[
     {'@type':'ListItem',position:1,name:'ROAMA Signal Quest',item:origin},
     {'@type':'ListItem',position:2,name:challenge.title,item:canonical},
    ],
   },
  ],
 };
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd(structuredData)}}/><ChallengeDetail challenge={challenge} verificationEnabled={emailVerificationConfigured()}/></>;
}
