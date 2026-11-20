import {beforeEach,describe,expect,it,vi} from 'vitest';

const count=vi.hoisted(()=>vi.fn());
vi.mock('@/lib/prisma',()=>({prisma:{completion:{count}}}));

import {VERIFIED_STAR_WHERE,resetVerifiedStarCacheForTests,verifiedStarCountWithin,verifiedStars} from '@/lib/verified-stars';
import {GET} from '@/app/api/verified-stars/route';

beforeEach(()=>{
  count.mockReset();
  resetVerifiedStarCacheForTests();
});

describe('single verified star count',()=>{
  it('counts only accepted completions whose adult organizer email was verified',async()=>{
    count.mockResolvedValue(2);
    expect((await verifiedStars()).count).toBe(2);
    expect(count).toHaveBeenCalledWith({where:VERIFIED_STAR_WHERE});
    expect(VERIFIED_STAR_WHERE).toEqual({status:'ACCEPTED',emailVerifiedAt:{not:null}});
  });

  it('reuses a public count for 30 seconds and can always be read fresh',async()=>{
    count.mockResolvedValueOnce(2).mockResolvedValueOnce(3).mockResolvedValueOnce(4);
    const start=new Date('2026-12-20T18:00:00Z');
    expect((await verifiedStars({now:start})).count).toBe(2);
    expect((await verifiedStars({now:new Date(start.getTime()+29_000)})).count).toBe(2);
    expect((await verifiedStars({now:new Date(start.getTime()+31_000)})).count).toBe(3);
    expect((await verifiedStars({maxAgeMs:0})).count).toBe(4);
    expect(count).toHaveBeenCalledTimes(3);
  });

  it('never makes server rendering wait on a slow or failing database',async()=>{
    count.mockReturnValueOnce(new Promise(()=>undefined));
    expect(await verifiedStarCountWithin(20)).toBeNull();
    vi.spyOn(console,'error').mockImplementation(()=>undefined);
    count.mockRejectedValueOnce(new Error('connect postgresql://user:secret@db.example/prod failed'));
    expect(await verifiedStarCountWithin(500)).toBeNull();
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('secret');
  });
});

describe('public JSON: /api/verified-stars',()=>{
  it('serves the count, goal and rule to any site, with short caching',async()=>{
    count.mockResolvedValue(0);
    const response=await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('cache-control')).toBe('public, max-age=30');
    const body=await response.json();
    expect(body).toMatchObject({count:0,goal:1_000_000});
    expect(body.rule).toContain('adult organizer verifies their email');
    expect(Number.isNaN(Date.parse(body.checkedAt))).toBe(false);
    expect(Object.keys(body).sort()).toEqual(['checkedAt','count','goal','rule']);
  });

  it('says so instead of inventing a number when the database is unavailable',async()=>{
    vi.spyOn(console,'error').mockImplementation(()=>undefined);
    count.mockRejectedValue(new Error('database down'));
    const response=await GET();
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect((await response.json()).count).toBeNull();
  });
});
