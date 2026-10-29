import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
import {decryptWaitlistEmail} from '@/lib/android-waitlist';

const mocks=vi.hoisted(()=>({
  createMany:vi.fn(),deleteMany:vi.fn(),eventCreate:vi.fn(),transaction:vi.fn(),challenge:vi.fn(),sameOrigin:vi.fn(),rateLimit:vi.fn(),abuseKey:vi.fn(),
}));
vi.mock('@/lib/prisma',()=>({prisma:{
  $transaction:mocks.transaction,
  challenge:{findFirst:mocks.challenge},
}}));
vi.mock('@/lib/session',()=>({isSameOrigin:mocks.sameOrigin}));
vi.mock('@/lib/rate-limit',()=>({rateLimit:mocks.rateLimit,abuseKey:mocks.abuseKey}));
import {POST} from '@/app/api/android-waitlist/route';

const data={
  email:' Adult@Example.Test ',
  source:'android_waitlist',
  completed_challenge:'shadow-signal',
  adultConsent:true,
  language:'tr',
  website:'',
  attribution:{source:'tiktok',medium:'social',campaign:'launch',content:'shadow_a'},
};

function request(body:unknown) {
  return new NextRequest('https://signalquest.test/api/android-waitlist',{
    method:'POST',headers:{origin:'https://signalquest.test','Content-Type':'application/json'},body:JSON.stringify(body),
  });
}

beforeEach(()=>{
  vi.clearAllMocks();
  vi.stubEnv('ADULT_EMAIL_HASH_SECRET','test-only-waitlist-secret-with-at-least-32-characters');
  mocks.sameOrigin.mockReturnValue(true);
  mocks.rateLimit.mockResolvedValue(true);
  mocks.abuseKey.mockReturnValue('network-digest');
  mocks.challenge.mockResolvedValue({id:'challenge-id'});
  mocks.createMany.mockResolvedValue({count:1});
  mocks.deleteMany.mockResolvedValue({count:0});
  mocks.eventCreate.mockResolvedValue({});
  mocks.transaction.mockImplementation(async callback=>callback({
    androidWaitlist:{createMany:mocks.createMany,deleteMany:mocks.deleteMany},
    analyticsEvent:{create:mocks.eventCreate},
  }));
});
afterEach(()=>vi.unstubAllEnvs());

describe('Android launch signup endpoint',()=>{
  it('requires same-origin, a valid adult email and explicit separate notification consent',async()=>{
    mocks.sameOrigin.mockReturnValue(false);
    expect((await POST(request(data))).status).toBe(403);
    mocks.sameOrigin.mockReturnValue(true);
    for(const invalid of [
      {...data,email:'invalid'}, {...data,adultConsent:false}, {...data,source:'star_verification'},
      {...data,completed_challenge:'invented'}, {...data,website:'spam.test'}, {...data,language:'unknown'},
    ])expect((await POST(request(invalid))).status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('saves encrypted adult email, source, challenge and UTMs atomically without creating a star or sending email',async()=>{
    const before=Date.now();
    const response=await POST(request(data));
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ok:true});
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(mocks.createMany).toHaveBeenCalledWith({data:[expect.objectContaining({
      source:'android_waitlist',completedChallenge:'shadow-signal',language:'tr',
      utmSource:'tiktok',medium:'social',campaign:'launch',content:'shadow_a',
    })],skipDuplicates:true});
    const stored=mocks.createMany.mock.calls[0][0].data[0];
    expect(decryptWaitlistEmail(stored.encryptedEmail)).toBe('adult@example.test');
    expect(stored.expiresAt.getTime()).toBeGreaterThanOrEqual(before+90*86400000);
    expect(JSON.stringify(stored)).not.toContain('adult@example.test');
    expect(mocks.eventCreate).toHaveBeenCalledWith({data:{
      type:'ANDROID_WAITLIST_SIGNUP',challengeId:'challenge-id',target:'android_waitlist',
      source:'tiktok',medium:'social',campaign:'launch',content:'shadow_a',
    }});
    expect(JSON.stringify(mocks.eventCreate.mock.calls)).not.toContain('adult@example.test');
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.deleteMany).toHaveBeenCalledWith({where:{emailHash:stored.emailHash,expiresAt:{lte:expect.any(Date)}}});
  });

  it('returns the same response for duplicates, without changing first consent/attribution or incrementing events',async()=>{
    mocks.createMany.mockResolvedValue({count:0});
    expect(await (await POST(request(data))).json()).toEqual({ok:true});
    expect(mocks.eventCreate).not.toHaveBeenCalled();
  });

  it('supports homepage signups with no completed challenge and rejects private attribution',async()=>{
    const response=await POST(request({...data,completed_challenge:undefined,attribution:{source:'private@example.test',content:'a'.repeat(64)}}));
    expect(response.status).toBe(202);
    expect(mocks.challenge).not.toHaveBeenCalled();
    expect(mocks.eventCreate).toHaveBeenCalledWith({data:{type:'ANDROID_WAITLIST_SIGNUP',challengeId:undefined,target:'android_waitlist'}});
  });

  it('enforces network and email limits',async()=>{
    mocks.rateLimit.mockResolvedValueOnce(false);
    expect((await POST(request(data))).status).toBe(429);
    mocks.rateLimit.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    expect((await POST(request(data))).status).toBe(429);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('does not report success when schema, encryption configuration or transaction writes fail',async()=>{
    const logger=vi.spyOn(console,'error').mockImplementation(()=>{});
    try {
      mocks.transaction.mockRejectedValueOnce(new Error('database connection unavailable'));
      expect((await POST(request(data))).status).toBe(503);
      mocks.eventCreate.mockRejectedValueOnce(new Error('event failure rolls back signup'));
      expect((await POST(request(data))).status).toBe(503);
      vi.stubEnv('ADULT_EMAIL_HASH_SECRET','');
      expect((await POST(request(data))).status).toBe(503);
      expect(JSON.stringify(logger.mock.calls)).not.toContain('adult@example.test');
    } finally {
      logger.mockRestore();
    }
  });
});
