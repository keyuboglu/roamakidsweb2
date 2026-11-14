import {NextResponse} from 'next/server';

export async function POST() {
  return NextResponse.json({error:'Android launch signups are closed. No email was collected.'},{status:410,headers:{'Cache-Control':'no-store'}});
}
