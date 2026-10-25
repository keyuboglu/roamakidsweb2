import {NextRequest,NextResponse} from 'next/server';
import {isSameOrigin} from '@/lib/session';

export async function POST(req:NextRequest) {
  if(!isSameOrigin(req))return NextResponse.json({error:'Request origin rejected.'},{status:403});
  return NextResponse.json({error:'Star claims are paused until adult email verification is configured. No star has been created.'},{status:503});
}
