import {beforeEach,afterEach,describe,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
import {analyticsDay,analyticsCutoff} from '@/lib/anonymous-analytics';

const mocks=vi.hoisted(()=>({upsert:vi.fn(),deleteMany:vi.fn(),transaction:vi.fn(),sameOrigin:vi.fn(),abuseKey:vi.fn()}));
vi.mock('@/lib/prisma',()=>({prisma:{
  anonymousDailyCount:{upsert:mocks.upsert,deleteMany:mocks.deleteMany},
  $transaction:mocks.transaction,
}}));
vi.mock('@/lib/session',()=>({isSameOrigin:mocks.sameOrigin}));
vi.mock('@/lib/rate-limit',()=>({abuseKey:mocks.abuseKey}));
import {POST} from '@/app/api/events/route';

function request(body:unknown,headers:Record<string,string>={}) {
  return new NextRequest('https://signalquest.test/api/events',{
    method:'POST',headers:{origin:'https://signalquest.test','content-type':'application/json',...headers},body:JSON.stringify(body),
  });
}

describe('anonymous daily event endpoint',()=>{
  beforeEach(()=>{
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-20T23:59:59Z'));
    mocks.sameOrigin.mockReturnValue(true);
    mocks.transaction.mockResolvedValue([{count:0},{count:14}]);
  });
  afterEach(()=>vi.useRealTimers());

  it('rejects cross-origin requests without a database write',async()=>{
    mocks.sameOrigin.mockReturnValue(false);
    expect((await POST(request({event:'page_view:/',source:'direct'}))).status).toBe(403);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('rejects arbitrary event/source labels and all extra identifying fields',async()=>{
    for(const body of [
      {event:'page_view:/?email=private@example.test',source:'direct'},
      {event:'challenge_view:PrivateChild',source:'wa'},
      {event:'page_view:/',source:'family-identifier'},
      {event:'page_view:/',source:'direct',referralCode:'unique-link'},
      {event:'page_view:/',source:'direct',email:'private@example.test'},
      {event:'page_view:/',source:'direct',sessionId:'unique-session'},
      {event:'page_view:/',source:'direct',medium:'social'},
    ])expect((await POST(request(body))).status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('atomically increments only event/date/source and creates no IP-keyed rate bucket or cookie',async()=>{
    const response=await POST(request({event:'challenge_start:shadow-signal',source:'wa'},{'user-agent':'Do not store','cf-connecting-ip':'192.0.2.1'}));
    const key={event:'challenge_start:shadow-signal',date:new Date('2026-11-20T00:00:00Z'),source:'wa'};
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ok:true});
    expect(response.headers.has('set-cookie')).toBe(false);
    expect(mocks.upsert).toHaveBeenCalledWith({where:{event_date_source:key},create:{...key,count:1},update:{count:{increment:1}},select:{count:true}});
    expect(mocks.deleteMany).toHaveBeenCalledWith({where:{date:{lt:new Date('2026-10-22T00:00:00Z')}}});
    expect(mocks.abuseKey).not.toHaveBeenCalled();
    expect(JSON.stringify(mocks.upsert.mock.calls)).not.toMatch(/Do not store|192.0.2.1|referral|createdAt|session|userAgent/i);
  });

  it('uses UTC date boundaries and retains at most 30 calendar days',()=>{
    expect(analyticsDay(new Date('2026-11-21T00:01:00+03:00')).toISOString()).toBe('2026-11-20T00:00:00.000Z');
    expect(analyticsCutoff(new Date('2026-11-20T23:59:59Z')).toISOString()).toBe('2026-10-22T00:00:00.000Z');
    expect(analyticsCutoff(new Date('2026-11-21T00:00:00Z')).toISOString()).toBe('2026-10-23T00:00:00.000Z');
  });

  it('surfaces database errors instead of claiming a count was recorded',async()=>{
    const error=vi.spyOn(console,'error').mockImplementation(()=>{});
    mocks.transaction.mockRejectedValue(new Error('database unavailable'));
    try {
      expect((await POST(request({event:'app_store_click',source:'direct'}))).status).toBe(503);
      expect(error).toHaveBeenCalled();
    } finally {error.mockRestore();}
  });
});
