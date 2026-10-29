import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {isSameOrigin} from '@/lib/session';
import {abuseKey,rateLimit} from '@/lib/rate-limit';
import {sanitizeAttribution} from '@/lib/attribution';
import {campaignChallenges} from '@/lib/challenge-content';
import {encryptWaitlistEmail,waitlistEmailHash,WAITLIST_RETENTION_MS} from '@/lib/android-waitlist';

const schema=z.object({
  email:z.string().trim().email().max(254),
  source:z.literal('android_waitlist'),
  completed_challenge:z.string().max(100).optional(),
  language:z.enum(['en','tr']),
  adultConsent:z.literal(true),
  website:z.string().max(0).optional(),
  attribution:z.object({
    source:z.string().max(100).optional(),
    medium:z.string().max(100).optional(),
    campaign:z.string().max(100).optional(),
    content:z.string().max(100).optional(),
    referralCode:z.string().max(100).optional(),
  }).optional(),
});

export async function POST(req:NextRequest) {
  if(!isSameOrigin(req))return NextResponse.json({error:'Request origin rejected.'},{status:403});
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:'Enter an adult email and agree to the launch notification.'},{status:400});
  if(parsed.data.completed_challenge&&!campaignChallenges.some(challenge=>challenge.slug===parsed.data.completed_challenge)){
    return NextResponse.json({error:'Unknown completed challenge.'},{status:400});
  }
  try {
    if(!await rateLimit(`android-waitlist:${abuseKey(req)}`,5,3600)){
      return NextResponse.json({error:'Too many requests. Please wait before trying again.'},{status:429});
    }
    const email=parsed.data.email.toLowerCase();
    const emailHash=waitlistEmailHash(email);
    if(!await rateLimit(`waitlist-address:${emailHash}`,3,3600)){
      return NextResponse.json({error:'Please wait before submitting this address again.'},{status:429});
    }
    const attribution=sanitizeAttribution(parsed.data.attribution);
    const completedChallenge=parsed.data.completed_challenge;
    const challenge=completedChallenge?await prisma.challenge.findFirst({
      where:{slug:completedChallenge,status:'PUBLISHED'},select:{id:true},
    }):null;
    await prisma.$transaction(async tx=>{
      await tx.androidWaitlist.deleteMany({where:{emailHash,expiresAt:{lte:new Date()}}});
      const created=await tx.androidWaitlist.createMany({
        data:[{
          emailHash,
          encryptedEmail:encryptWaitlistEmail(email),
          source:'android_waitlist',
          completedChallenge,
          language:parsed.data.language,
          utmSource:attribution.source,
          medium:attribution.medium,
          campaign:attribution.campaign,
          content:attribution.content,
          referralCode:attribution.referralCode,
          expiresAt:new Date(Date.now()+WAITLIST_RETENTION_MS),
        }],
        skipDuplicates:true,
      });
      if(created.count===1)await tx.analyticsEvent.create({
        data:{type:'ANDROID_WAITLIST_SIGNUP',challengeId:challenge?.id,target:'android_waitlist',...attribution},
      });
    });
    // The same response for new and existing addresses avoids email enumeration.
    return NextResponse.json({ok:true},{status:202,headers:{'Cache-Control':'no-store'}});
  } catch(error) {
    console.error('Android waitlist registration unavailable.',error instanceof Error?error.name:'UnknownError');
    return NextResponse.json({error:'The waitlist is temporarily unavailable. Your signup was not confirmed; please try again later.'},{status:503});
  }
}
