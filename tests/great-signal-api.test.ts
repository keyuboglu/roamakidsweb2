import {beforeEach,describe,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
const mocks=vi.hoisted(()=>({findMany:vi.fn(),groupBy:vi.fn(),query:vi.fn()}));
vi.mock('@/lib/prisma',()=>({prisma:{completion:{findMany:mocks.findMany,groupBy:mocks.groupBy},$queryRaw:mocks.query}}));
vi.mock('@/lib/rate-limit',()=>({rateLimit:async()=>true,abuseKey:()=> 'test'}));
import {GET} from '@/app/api/stars/route';
import {GREAT_SIGNAL_START,GREAT_SIGNAL_END} from '@/lib/great-signal';

beforeEach(()=>{
  vi.clearAllMocks();
  mocks.findMany.mockResolvedValue([
    {starNumber:1,starName:'Private event pseudonym',emailVerifiedAt:new Date('2026-12-20T12:00:00Z'),challenge:{slug:'shadow-signal'}},
    {starNumber:2,starName:'Other star',emailVerifiedAt:new Date('2026-11-14'),challenge:{slug:'shadow-signal'}},
  ]);
  mocks.query.mockResolvedValue([{tileX:0,tileY:0,count:2}]);
  mocks.groupBy.mockResolvedValue([{countryCode:'TR',_count:2}]);
});

describe('Great Signal public map',()=>{
  it('exposes only the event flag and aggregate country count, never event names, timestamps or country codes',async()=>{
    const response=await GET(new NextRequest('https://signalquest.test/api/stars'));
    const data=await response.json();
    expect(data.recent[0]).toEqual({starNumber:1,starName:null,greatSignal:true});
    expect(data.recent[1]).toEqual({starNumber:2,starName:'Other star',greatSignal:false});
    expect(data.greatSignal).toMatchObject({total:2,countries:1});
    expect(JSON.stringify(data)).not.toMatch(/Private event pseudonym|countryCode|emailVerifiedAt/);
  });
  it('applies the same date, verification and challenge filter to event tiles',async()=>{
    const response=await GET(new NextRequest('https://signalquest.test/api/stars?layer=great-signal-2026&tileX=0&tileY=0'));
    expect(response.status).toBe(200);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({
      status:'ACCEPTED',emailVerifiedAt:{gte:GREAT_SIGNAL_START,lt:GREAT_SIGNAL_END},challenge:{slug:'shadow-signal'},
    })}));
  });
  it('does not silently report zero when the database fails',async()=>{
    mocks.findMany.mockRejectedValue(new Error('unavailable'));
    const logger=vi.spyOn(console,'error').mockImplementation(()=>{});
    try {expect((await GET(new NextRequest('https://signalquest.test/api/stars'))).status).toBe(503);}
    finally {logger.mockRestore();}
  });
});
