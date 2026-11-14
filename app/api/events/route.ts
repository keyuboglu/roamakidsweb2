import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {isSameOrigin} from '@/lib/session';
import {ANALYTICS_SOURCES,ANONYMOUS_EVENTS,analyticsDay,analyticsCutoff} from '@/lib/anonymous-analytics';

const schema=z.object({
  event:z.string().refine(event=>ANONYMOUS_EVENTS.has(event)),
  source:z.enum(ANALYTICS_SOURCES),
}).strict();

export async function POST(req:NextRequest) {
  if(!isSameOrigin(req))return NextResponse.json({error:'Origin rejected.'},{status:403});
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:'Only an allowed event and anonymous source category are accepted.'},{status:400});
  const now=new Date();
  const key={event:parsed.data.event,date:analyticsDay(now),source:parsed.data.source};
  try {
    await prisma.$transaction([
      prisma.anonymousDailyCount.deleteMany({where:{date:{lt:analyticsCutoff(now)}}}),
      prisma.anonymousDailyCount.upsert({
        where:{event_date_source:key},
        create:{...key,count:1},
        update:{count:{increment:1}},
        select:{count:true},
      }),
    ]);
    return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  } catch(error) {
    console.error('Anonymous daily totals unavailable.',error instanceof Error?error.name:'UnknownError');
    return NextResponse.json({error:'Anonymous totals unavailable.'},{status:503});
  }
}
