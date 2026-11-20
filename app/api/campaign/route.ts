import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {STAR_CAPACITY} from '@/lib/stars';
import {verifiedStars} from '@/lib/verified-stars';
import {campaignChallenges,mergeCampaignChallenges} from '@/lib/challenge-content';
import {GOOGLE_PLAY_URL,OFFICIAL_IOS_STORE_URL} from '@/lib/brand';

export const dynamic='force-dynamic';
export async function GET() {
  try {
    const [count,config,overrides]=await Promise.all([
      verifiedStars({maxAgeMs:0}).then(snapshot=>snapshot.count),
      prisma.campaignConfig.findUnique({where:{id:1}}),
      prisma.challenge.findMany({where:{status:'PUBLISHED',slug:{in:campaignChallenges.map(challenge=>challenge.slug)}},select:{slug:true,title:true,shortDescription:true,description:true,instructions:true,safety:true,duration:true,imageUrl:true}}),
    ]);
    const live=config?.published??false;
    return NextResponse.json({
      configured:true,count,goal:STAR_CAPACITY,title:'ROAMA Kids · Signal Quest',
      headline:live?config?.headline:'A MILLION STARS. ONE GLOBAL QUEST.',
      description:live?config?.description:'Explore the real world, complete a challenge, and earn your star in the ROAMA Kids universe.',
      milestones:config?.milestones??[],iosStoreUrl:OFFICIAL_IOS_STORE_URL,androidStoreUrl:GOOGLE_PLAY_URL,
      challenges:mergeCampaignChallenges(overrides),
    },{headers:{'Cache-Control':'no-store'}});
  } catch(error) {
    console.error('Campaign database request failed.',error instanceof Error?error.message.replace(/postgres(?:ql)?:\/\/[^\s]+/g,'[redacted-database-url]'):'Unknown error');
    return NextResponse.json({configured:false,count:null,goal:STAR_CAPACITY,iosStoreUrl:OFFICIAL_IOS_STORE_URL,androidStoreUrl:GOOGLE_PLAY_URL,challenges:campaignChallenges,error:'The live star count is temporarily unavailable.'},{status:200});
  }
}
