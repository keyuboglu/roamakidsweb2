import {NextRequest,NextResponse} from 'next/server';import {clearSession,isSameOrigin} from '@/lib/session';
export async function POST(req:NextRequest){if(!isSameOrigin(req))return NextResponse.json({error:'Request origin rejected.'},{status:403});const res=NextResponse.json({ok:true});clearSession(res);return res;}
