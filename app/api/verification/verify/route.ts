import {createHash} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {emailVerificationConfigured} from '@/lib/email-verification';
import {redeemEmailVerificationToken} from '@/lib/registrations';
import {abuseKey,rateLimit} from '@/lib/rate-limit';
import {isSameOrigin} from '@/lib/session';

const schema=z.object({token:z.string().regex(/^[a-f0-9]{64}$/i)});

export async function POST(req:NextRequest) {
  if(!isSameOrigin(req))return NextResponse.json({error:'Request origin rejected.'},{status:403});
  if(!emailVerificationConfigured()){
    return NextResponse.json({error:'Adult email verification is not configured yet. No email was collected and no star was created.'},{status:503});
  }
  let body:unknown;
  try {
    body=await req.json();
  } catch {
    return NextResponse.json({error:'This verification link is invalid. Request a new link and try again.'},{status:400});
  }
  const parsed=schema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:'This verification link is invalid. Request a new link and try again.'},{status:400});
  try {
    const networkHash=abuseKey(req);
    if(!await rateLimit(`verify-redeem:${networkHash}`,10,3600)){
      return NextResponse.json({error:'Too many verification attempts. Please wait before trying again.'},{status:429});
    }
    const tokenHash=createHash('sha256').update(parsed.data.token).digest('hex');
    const result=await redeemEmailVerificationToken(tokenHash,networkHash);
    if(!result.ok){
      if(result.reason==='full')return NextResponse.json({error:'The million-star sky is full. This link was not used.'},{status:409});
      const message=result.reason==='expired'
        ?'This verification link has expired. Request a new one and try again.'
        :result.reason==='used'
          ?'This verification link has already been used. Request a new link to recover your star.'
          :'This verification link is invalid. Request a new link and try again.';
      return NextResponse.json({error:message},{status:410});
    }
    return NextResponse.json({
      starNumber:result.starNumber,
      starName:result.starName,
      count:result.count,
      recovered:result.duplicate,
    },{headers:{'Cache-Control':'no-store'}});
  } catch(error) {
    const code=typeof error==='object'&&error!==null&&'code' in error&&typeof error.code==='string'
      ?error.code
      :error instanceof Error?error.name:'UnknownError';
    console.error('Adult email verification could not be completed.',code);
    return NextResponse.json({error:'Verification is temporarily unavailable. Your request is safe to retry.'},{status:503});
  }
}
