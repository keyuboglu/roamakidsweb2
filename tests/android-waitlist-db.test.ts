import {afterAll,beforeAll,describe,expect,it,vi} from 'vitest';
import {randomUUID} from 'node:crypto';
import {NextRequest} from 'next/server';
import {prisma} from '@/lib/prisma';
import {POST} from '@/app/api/android-waitlist/route';
import {decryptWaitlistEmail,waitlistEmailHash,encryptWaitlistEmail} from '@/lib/android-waitlist';

describe.skipIf(!process.env.TEST_DATABASE_URL)('PostgreSQL Android waitlist',()=>{
  const campaign=`test_${randomUUID()}`;
  const email=`${randomUUID()}@example.test`;
  const network=randomUUID();
  let emailHash='';
  beforeAll(async()=>{
    vi.stubEnv('NEXT_PUBLIC_SITE_URL','https://roama.test');
    vi.stubEnv('ADULT_EMAIL_HASH_SECRET','isolated-waitlist-test-secret-at-least-thirty-two-characters');
    emailHash=waitlistEmailHash(email);
    await prisma.$connect();
  });
  afterAll(async()=>{
    await prisma.androidWaitlist.deleteMany({where:{emailHash}});
    await prisma.analyticsEvent.deleteMany({where:{campaign}});
    await prisma.$disconnect();
    vi.unstubAllEnvs();
  });

  function request() {
    return new NextRequest('https://roama.test/api/android-waitlist',{
      method:'POST',
      headers:{origin:'https://roama.test','Content-Type':'application/json','x-real-ip':network},
      body:JSON.stringify({
        email,adultConsent:true,language:'en',source:'android_waitlist',
        completed_challenge:'shadow-signal',attribution:{source:'tiktok',campaign,content:'shadow_test'},
      }),
    });
  }

  it('deduplicates concurrent signup transactions and their analytics events',async()=>{
    const responses=await Promise.all([POST(request()),POST(request())]);
    expect(responses.map(response=>response.status)).toEqual([202,202]);
    expect(await prisma.androidWaitlist.count({where:{emailHash}})).toBe(1);
    expect(await prisma.analyticsEvent.count({where:{campaign,type:'ANDROID_WAITLIST_SIGNUP'}})).toBe(1);
    const saved=await prisma.androidWaitlist.findUniqueOrThrow({where:{emailHash}});
    expect(decryptWaitlistEmail(saved.encryptedEmail)).toBe(email);
    expect(saved).toMatchObject({source:'android_waitlist',completedChallenge:'shadow-signal',utmSource:'tiktok',consentVersion:'android-launch-v1'});
    const serialized=JSON.stringify(await prisma.analyticsEvent.findMany({where:{campaign}}));
    expect(serialized).not.toContain(email);
    expect(serialized).not.toContain(emailHash);
    expect(await prisma.completion.count({where:{adultEmailHash:emailHash}})).toBe(0);
  });

  it('rolls back a subscriber when a later operation in the transaction fails',async()=>{
    const rollbackHash=waitlistEmailHash(`rollback-${email}`);
    await expect(prisma.$transaction(async tx=>{
      await tx.androidWaitlist.create({data:{
        emailHash:rollbackHash,encryptedEmail:encryptWaitlistEmail(email),language:'en',expiresAt:new Date(Date.now()+86400000),
      }});
      throw new Error('test-only forced transaction rollback');
    })).rejects.toThrow('test-only forced transaction rollback');
    expect(await prisma.androidWaitlist.count({where:{emailHash:rollbackHash}})).toBe(0);
  });
});
