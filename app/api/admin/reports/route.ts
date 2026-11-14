import {NextRequest,NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {analyticsDay} from '@/lib/anonymous-analytics';

const DAY_MS=86400000;

export async function GET(req:NextRequest) {
  if(!await requireAdmin(req))return NextResponse.json({error:'Not authorized.'},{status:401});
  const requestedDays=Number(req.nextUrl.searchParams.get('days')||30);
  if(![7,30].includes(requestedDays))return NextResponse.json({error:'Choose a 7 or 30 day report window.'},{status:400});
  try{
    const since=new Date(analyticsDay().getTime()-(requestedDays-1)*DAY_MS);
    const [total,challengeRows,events,attributionRows,recent]=await Promise.all([
      prisma.completion.count({where:{status:'ACCEPTED',emailVerifiedAt:{not:null}}}),
      prisma.challenge.findMany({
        select:{id:true,slug:true,title:true,_count:{select:{completions:{where:{status:'ACCEPTED',emailVerifiedAt:{not:null}}}}}},
        orderBy:{displayOrder:'asc'},
      }),
      prisma.anonymousDailyCount.groupBy({
        by:['event'],
        _sum:{count:true},
        where:{date:{gte:since}},
      }),
      prisma.anonymousDailyCount.findMany({
        select:{event:true,date:true,source:true,count:true},
        where:{date:{gte:since}},
        orderBy:[{date:'desc'},{event:'asc'},{source:'asc'}],
      }),
      prisma.completion.findMany({
        where:{emailVerifiedAt:{not:null},abuseKey:{not:null},registeredAt:{gte:new Date(Date.now()-DAY_MS)}},
        select:{abuseKey:true},
      }),
    ]);
    const tallies=new Map<string,number>();
    recent.forEach(entry=>{
      if(entry.abuseKey)tallies.set(entry.abuseKey,(tallies.get(entry.abuseKey)||0)+1);
    });
    const suspiciousCount=[...tallies.values()].filter(count=>count>5).length;
    return NextResponse.json({
      total,
      periodDays:requestedDays,
      byChallenge:challengeRows.map(challenge=>({
        slug:challenge.slug,
        title:challenge.title,
        count:challenge._count.completions,
      })),
      events:events.map(event=>({type:event.event,count:event._sum.count||0})),
      attribution:attributionRows.map(row=>({
        type:row.event,
        date:row.date.toISOString().slice(0,10),
        source:row.source,
        count:row.count,
      })),
      suspiciousCount,
    });
  }catch(error){
    console.error('Aggregate campaign report unavailable.',error instanceof Error?error.name:'UnknownError');
    return NextResponse.json({error:'Could not load reports.'},{status:503});
  }
}
