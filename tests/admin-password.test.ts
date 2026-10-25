import {afterAll,describe,expect,it} from 'vitest';
import bcrypt from 'bcryptjs';
import {verifyAdminPassword} from '@/lib/admin-password';
import {prisma} from '@/lib/prisma';

describe.skipIf(!process.env.TEST_DATABASE_URL)('PostgreSQL bcrypt verification',()=>{
  afterAll(()=>prisma.$disconnect());

  it('accepts existing bcryptjs hashes and rejects incorrect passwords',async()=>{
    const password="test-only-password-'with-quotes";
    const hash=await bcrypt.hash(password,4);
    expect(await verifyAdminPassword(password,hash)).toBe(true);
    expect(await verifyAdminPassword(password,hash.replace('$2b$','$2a$'))).toBe(true);
    expect(await verifyAdminPassword('incorrect-password',hash)).toBe(false);
    expect(await verifyAdminPassword("' OR TRUE --",hash)).toBe(false);
  });

  it('preserves bcrypt verification for non-ASCII passwords',async()=>{
    const password='test-only-\u00e9-\u0131-\u2605-password';
    const hash=await bcrypt.hash(password,4);
    expect(await verifyAdminPassword(password,hash)).toBe(true);
  });
});
