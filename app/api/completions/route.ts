import {NextRequest,NextResponse} from 'next/server';
import {abuseKey,rateLimit} from '@/lib/rate-limit';
import {isSameOrigin} from '@/lib/session';
import {registerCompletion} from '@/lib/registrations';
import {completionSchema} from '@/lib/completion-input';

export async function POST(req:NextRequest) {
  if(!isSameOrigin(req))return NextResponse.json({error:'Request origin rejected.'},{status:403});
  if(Number(req.headers.get('content-length')||0)>4096)return NextResponse.json({error:'Request too large.'},{status:413});
  const parsed=completionSchema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||'Please confirm the activity with an adult and try again.'},{status:400});
  try {
    const hashed=abuseKey(req);
    if(!await rateLimit(`completion:${hashed}`,30,3600))return NextResponse.json({error:'Please wait before registering another challenge.'},{status:429});
    const result=await registerCompletion({slug:parsed.data.challengeSlug,idempotencyKey:parsed.data.idempotencyKey,abuseKey:hashed,starName:parsed.data.starName});
    if(!result.ok){
      const errors={
        key_conflict:{error:'This confirmation key was already used for a different challenge.',status:409},
        unavailable:{error:'That challenge is not available right now.',status:404},
        full:{error:'All one million stars have been lit. Thank you for being part of the quest!',status:409},
      };
      const failure=errors[result.reason];
      return NextResponse.json({error:failure.error},{status:failure.status});
    }
    return NextResponse.json({count:result.count,duplicate:result.duplicate,starNumber:result.starNumber,starName:result.starName});
  } catch(error) {
    console.error('Completion registration failed.',error instanceof Error?error.name:'UnknownError');
    return NextResponse.json({error:'We could not add your star just now. Please try again.'},{status:503});
  }
}
