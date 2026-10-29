import {NextRequest,NextResponse} from 'next/server';
import {createHash,randomBytes} from 'node:crypto';
import {z} from 'zod';
import {adultEmailDigest,emailVerificationConfigured,EMAIL_VERIFICATION_TTL_MS,sendVerificationEmail} from '@/lib/email-verification';
import {starNameSchema} from '@/lib/completion-input';
import {prisma} from '@/lib/prisma';
import {abuseKey,rateLimit} from '@/lib/rate-limit';
import {isSameOrigin} from '@/lib/session';
import {attributionFields,sanitizeAttribution} from '@/lib/attribution';

const schema=z.object({
  email:z.string().trim().email().max(254),
  challengeSlug:z.string().min(1).max(100),
  adultConfirmed:z.literal(true),
  starName:starNameSchema.optional(),
  publicNameConfirmed:z.boolean().optional(),
  website:z.string().max(0).optional(),
  language:z.enum(['en','tr']).optional(),
  source:z.string().max(100).optional(),
  medium:z.string().max(100).optional(),
  campaign:z.string().max(100).optional(),
  content:z.string().max(100).optional(),
  referralCode:z.string().max(100).optional(),
}).refine(value=>!value.starName||value.publicNameConfirmed===true,{
  message:'Confirm that the made-up name will be public.',
  path:['publicNameConfirmed'],
});

const genericResponse={message:'If the request can be completed, a verification link will arrive shortly.'};

export async function POST(req:NextRequest) {
  if(!isSameOrigin(req))return NextResponse.json({error:'Request origin rejected.'},{status:403});
  if(!emailVerificationConfigured()){
    return NextResponse.json({error:'Adult email verification is not configured yet. No email was collected and no star was created.'},{status:503});
  }
  let body:unknown;
  try {
    body=await req.json();
  } catch {
    return NextResponse.json({error:'Enter a valid request and try again.'},{status:400});
  }
  const parsed=schema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||'Check the form and try again.'},{status:400});
  if(parsed.data.website)return NextResponse.json(genericResponse,{status:202});
  const email=parsed.data.email.toLowerCase();
  const starName=parsed.data.starName||null;
  const attribution=sanitizeAttribution(parsed.data);

  try {
    const challenge=await prisma.challenge.findFirst({
      where:{slug:parsed.data.challengeSlug,status:'PUBLISHED'},
      select:{id:true},
    });
    if(!challenge)return NextResponse.json({error:'This challenge is not available for a star claim.'},{status:404});

    const networkHash=abuseKey(req);
    if(!await rateLimit(`verify-request:${networkHash}`,5,3600)){
      return NextResponse.json({error:'Too many verification requests. Please wait before trying again.'},{status:429});
    }
    const emailHash=adultEmailDigest(email);
    if(!await rateLimit(`verify-address:${emailHash}`,3,3600)){
      return NextResponse.json(genericResponse,{status:202});
    }

    const token=randomBytes(32).toString('hex');
    const tokenHash=createHash('sha256').update(token).digest('hex');
    const expiresAt=new Date(Date.now()+EMAIL_VERIFICATION_TTL_MS);
    await prisma.emailVerificationToken.create({
      data:{tokenHash,adultEmailHash:emailHash,challengeId:challenge.id,starName,expiresAt,...attributionFields(attribution)},
    });
    try {
      const sent=await sendVerificationEmail(email,token,parsed.data.language);
      if(!sent){
        await prisma.emailVerificationToken.deleteMany({where:{tokenHash}});
        console.error('Resend rejected a verification email request.');
        return NextResponse.json({error:'The verification email could not be sent. Please try again later.'},{status:503});
      }
    } catch(error) {
      await prisma.emailVerificationToken.deleteMany({where:{tokenHash}});
      console.error('Resend verification email failed.',error instanceof Error?error.name:'UnknownError');
      return NextResponse.json({error:'The verification email could not be sent. Please try again later.'},{status:503});
    }
    try {
      await prisma.analyticsEvent.create({data:{type:'COMPLETION_STARTED',challengeId:challenge.id,...attributionFields(attribution)}});
    } catch(error) {
      console.error('Verification request analytics unavailable.',error instanceof Error?error.name:'UnknownError');
    }
    return NextResponse.json(genericResponse,{status:202});
  } catch(error) {
    console.error('Adult email verification request unavailable.',error instanceof Error?error.name:'UnknownError');
    return NextResponse.json({error:'Verification is temporarily unavailable. Please retry safely later.'},{status:503});
  }
}
