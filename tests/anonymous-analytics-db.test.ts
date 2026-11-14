import {afterAll,beforeAll,describe,expect,it} from 'vitest';
import {NextRequest} from 'next/server';
import {prisma} from '@/lib/prisma';
import {POST} from '@/app/api/events/route';
import {analyticsDay,analyticsCutoff} from '@/lib/anonymous-analytics';
import {ANONYMIZE_LEGACY_ANALYTICS_SQL,EXPIRE_ANONYMOUS_TOTALS_SQL} from '@/lib/analytics-maintenance';

describe.skipIf(!process.env.TEST_DATABASE_URL)('PostgreSQL anonymous daily totals',()=>{
  const event='share:shadow-signal';
  const source='google';
  beforeAll(async()=>{
    await prisma.$connect();
    await prisma.anonymousDailyCount.deleteMany({where:{event,source}});
  });
  afterAll(async()=>{
    await prisma.anonymousDailyCount.deleteMany({where:{event,source}});
    await prisma.$disconnect();
  });

  it('coalesces concurrent requests into one daily row with exactly four fields',async()=>{
    const responses=await Promise.all(Array.from({length:14},()=>POST(new NextRequest('https://roama.test/api/events',{
      method:'POST',headers:{origin:'https://roama.test','content-type':'application/json','x-real-ip':'192.0.2.77','user-agent':'Do not retain'},
      body:JSON.stringify({event,source}),
    }))));
    expect(responses.every(response=>response.status===200)).toBe(true);
    const rows=await prisma.anonymousDailyCount.findMany({where:{event,source}});
    expect(rows).toEqual([{event,date:analyticsDay(),source,count:14}]);
    expect(await prisma.rateLimitBucket.count({where:{key:{startsWith:'analytics:'}}})).toBe(0);
  });

  it('converts legacy rows once, drops personal labels, and removes all raw and expired records',async()=>{
    const now=new Date();
    const old=new Date(analyticsCutoff().getTime()-86400000);
    await prisma.analyticsEvent.createMany({data:[
      {type:'SHARE',source:'legacy-person',referralCode:'e9d8c221-b899-47fc-9dc7-9e03ebfd12de',createdAt:now},
      {type:'SHARE',source:'legacy-person',createdAt:now},
      {type:'SHARE',source:'legacy-person',createdAt:old},
    ]});
    await prisma.anonymousDailyCount.create({data:{event,source,date:old,count:9}});
    try {
      const before=await prisma.anonymousDailyCount.findUnique({where:{event_date_source:{event:'share',date:analyticsDay(),source:'other'}}});
      await prisma.$transaction([prisma.$executeRawUnsafe(ANONYMIZE_LEGACY_ANALYTICS_SQL),prisma.$executeRawUnsafe(EXPIRE_ANONYMOUS_TOTALS_SQL)]);
      expect(await prisma.analyticsEvent.count()).toBe(0);
      const after=await prisma.anonymousDailyCount.findUniqueOrThrow({where:{event_date_source:{event:'share',date:analyticsDay(),source:'other'}}});
      expect(after).toEqual({event:'share',date:analyticsDay(),source:'other',count:(before?.count||0)+2});
      await prisma.$executeRawUnsafe(ANONYMIZE_LEGACY_ANALYTICS_SQL);
      expect(await prisma.anonymousDailyCount.findUnique({where:{event_date_source:{event:'share',date:analyticsDay(),source:'other'}}})).toEqual(after);
      expect(await prisma.anonymousDailyCount.count({where:{date:{lt:analyticsCutoff()}}})).toBe(0);
    } finally {
      await prisma.anonymousDailyCount.deleteMany({where:{event:'share',source:'other'}});
    }
  });
});
