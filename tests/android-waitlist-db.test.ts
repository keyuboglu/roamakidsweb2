import {afterAll,beforeAll,describe,expect,it,vi} from 'vitest';
import {randomUUID} from 'node:crypto';
import {prisma} from '@/lib/prisma';
import {POST} from '@/app/api/android-waitlist/route';
import {waitlistEmailHash,encryptWaitlistEmail} from '@/lib/android-waitlist';

describe.skipIf(!process.env.TEST_DATABASE_URL)('PostgreSQL Android waitlist',()=>{
  const campaign=`test_${randomUUID()}`;
  const email=`${randomUUID()}@example.test`;
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

  it('refuses concurrent signups without creating records or events',async()=>{
    const responses=await Promise.all([POST(),POST()]);
    expect(responses.map(response=>response.status)).toEqual([410,410]);
    expect(await prisma.androidWaitlist.count({where:{emailHash}})).toBe(0);
    expect(await prisma.analyticsEvent.count({where:{campaign,type:'ANDROID_WAITLIST_SIGNUP'}})).toBe(0);
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
