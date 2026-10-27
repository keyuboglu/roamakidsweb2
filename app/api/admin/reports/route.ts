import {NextRequest,NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

const DAY_MS=86400000;

export async function GET(req:NextRequest) {
  if(!await requireAdmin(req))return NextResponse.json({error:'Not authorized.'},{status:401});
  const requestedDays=Number(req.nextUrl.searchParams.get('days')||30);
  if(![7,30,90].includes(requestedDays))return NextResponse.json({error:'Choose a 7, 30, or 90 day report window.'},{status:400});
  try{
    const since=new Date(Date.now()-requestedDays*DAY_MS);
    const [total,challengeRows,events,attributionRows,recent]=await Promise.all([
      prisma.completion.count({where:{status:'ACCEPTED',emailVerifiedAt:{not:null}}}),
      prisma.challenge.findMany({
        select:{id:true,slug:true,title:true,_count:{select:{completions:{where:{status:'ACCEPTED',emailVerifiedAt:{not:null}}}}}},
        orderBy:{displayOrder:'asc'},
      }),
      prisma.analyticsEvent.groupBy({
        by:['type'],
        _count:{_all:true},
        where:{createdAt:{gte:since}},
      }),
      prisma.analyticsEvent.groupBy({
        by:['type','target','source','medium','campaign','content','referralCode','challengeId'],
        _count:{_all:true},
        where:{createdAt:{gte:since}},
        orderBy:{_count:{type:'desc'}},
        take:200,
      }),
      prisma.completion.findMany({
        where:{emailVerifiedAt:{not:null},abuseKey:{not:null},registeredAt:{gte:new Date(Date.now()-DAY_MS)}},
        select:{abuseKey:true},
      }),
    ]);
    const challengeById=new Map(challengeRows.map(challenge=>[challenge.id,challenge]));
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
      events:events.map(event=>({type:event.type,count:event._count._all})),
      attribution:attributionRows.map(row=>({
        type:row.type,
        target:row.target,
        source:row.source,
        medium:row.medium,
        campaign:row.campaign,
        content:row.content,
        referralCode:row.referralCode,
        challenge:row.challengeId?challengeById.get(row.challengeId)?.slug||null:null,
        count:row._count._all,
      })),
      suspiciousCount,
    });
  }catch(error){
    console.error('Aggregate campaign report unavailable.',error instanceof Error?error.name:'UnknownError');
    return NextResponse.json({error:'Could not load reports.'},{status:503});
  }
}
