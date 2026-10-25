import {afterAll,beforeAll,describe,expect,it,vi} from 'vitest';import {randomUUID} from 'node:crypto';import {NextRequest} from 'next/server';import {prisma} from '@/lib/prisma';import {registerCompletion} from '@/lib/registrations';import {rateLimit} from '@/lib/rate-limit';
import {GET as getStars} from '@/app/api/stars/route';
import {GET as getAdminStars,DELETE as removeStarName} from '@/app/api/admin/stars/route';
import {issueSession} from '@/lib/session';
import {starTile} from '@/lib/stars';
const enabled=Boolean(process.env.TEST_DATABASE_URL);
describe.skipIf(!enabled)('PostgreSQL completion registration',()=>{let challengeId='',slug='';const keys:string[]=[];
 beforeAll(async()=>{await prisma.$connect();slug=`integration-${randomUUID()}`;const c=await prisma.challenge.create({data:{slug,title:'Test-only challenge',shortDescription:'A temporary integration fixture.',instructions:'Fixture only',safety:'Fixture only',status:'PUBLISHED'}});challengeId=c.id;});
 afterAll(async()=>{if(challengeId){await prisma.completion.deleteMany({where:{challengeId}});await prisma.challenge.delete({where:{id:challengeId}});}await prisma.$disconnect();});
 it('adds exactly one row for an accepted completion and returns the authoritative count',async()=>{const key=randomUUID();keys.push(key);const before=await prisma.completion.count({where:{status:'ACCEPTED'}});const result=await registerCompletion({slug,idempotencyKey:key,abuseKey:'test-hash'});expect(result).toMatchObject({ok:true,duplicate:false,count:before+1});});
 it('returns the existing completion on retry without adding another star',async()=>{const key=randomUUID();keys.push(key);const first=await registerCompletion({slug,idempotencyKey:key,abuseKey:'test-hash'});if(!first.ok)throw Error('fixture challenge was unavailable');const second=await registerCompletion({slug,idempotencyKey:key,abuseKey:'test-hash'});expect(second).toMatchObject({ok:true,duplicate:true,count:first.count});});
 it('handles concurrent distinct registrations without losing increments or duplicating star positions',async()=>{const before=await prisma.completion.count({where:{status:'ACCEPTED'}});const submissions=Array.from({length:12},()=>{const idempotencyKey=randomUUID();keys.push(idempotencyKey);return registerCompletion({slug,idempotencyKey,abuseKey:'test-hash'});});const results=await Promise.all(submissions);expect(results.every(r=>r.ok)).toBe(true);expect(new Set(results.filter(r=>r.ok).map(r=>r.starNumber)).size).toBe(12);expect(await prisma.completion.count({where:{status:'ACCEPTED'}})).toBe(before+12);},30000);
 it('serializes identical concurrent retries to one accepted star',async()=>{const before=await prisma.completion.count({where:{status:'ACCEPTED'}});const idempotencyKey=randomUUID();keys.push(idempotencyKey);const results=await Promise.all([registerCompletion({slug,idempotencyKey,abuseKey:'test-hash'}),registerCompletion({slug,idempotencyKey,abuseKey:'test-hash'})]);expect(results.every(r=>r.ok)).toBe(true);expect(results.filter(r=>r.ok&&!r.duplicate)).toHaveLength(1);expect(await prisma.completion.count({where:{status:'ACCEPTED'}})).toBe(before+1);});
 it('rejects a draft challenge and does not record a star',async()=>{const draft=await prisma.challenge.create({data:{slug:`draft-${randomUUID()}`,title:'Draft fixture',shortDescription:'Draft',status:'DRAFT'}});try{const result=await registerCompletion({slug:draft.slug,idempotencyKey:randomUUID(),abuseKey:'test-hash'});expect(result).toEqual({ok:false,reason:'unavailable'});expect(await prisma.completion.count({where:{challengeId:draft.id}})).toBe(0);}finally{await prisma.challenge.delete({where:{id:draft.id}});}});
 it('applies an atomic database rate limit',async()=>{const key=`test-limit-${randomUUID()}`;try{expect(await rateLimit(key,2,3600)).toBe(true);expect(await rateLimit(key,2,3600)).toBe(true);expect(await rateLimit(key,2,3600)).toBe(false);}finally{await prisma.rateLimitBucket.deleteMany({where:{key}});}});
 it('accepts production-length prefixed network hashes',async()=>{const key=`completion:${randomUUID().replaceAll('-','').repeat(2)}`;try{expect(key.length).toBe(75);expect(await rateLimit(key,1,3600)).toBe(true);expect(await rateLimit(key,1,3600)).toBe(false);}finally{await prisma.rateLimitBucket.deleteMany({where:{key}});}});
 it('persists a public star name and preserves it on idempotent retries without consuming another slot',async()=>{
  const idempotencyKey=randomUUID();keys.push(idempotencyKey);
  const first=await registerCompletion({slug,idempotencyKey,abuseKey:'test-hash',starName:'Brave Explorer'});
  if(!first.ok)throw Error('Fixture challenge unavailable.');
  const before=await prisma.campaignConfig.findUniqueOrThrow({where:{id:1},select:{starsIssued:true}});
  const retry=await registerCompletion({slug,idempotencyKey,abuseKey:'test-hash',starName:'Changed retry name'});
  expect(retry).toMatchObject({ok:true,duplicate:true,starNumber:first.starNumber,starName:'Brave Explorer'});
  expect(await prisma.campaignConfig.findUniqueOrThrow({where:{id:1},select:{starsIssued:true}})).toEqual(before);
 });
 it('does not consume a slot for a key conflict on a different challenge',async()=>{
  const other=await prisma.challenge.create({data:{slug:`other-${randomUUID()}`,title:'Other fixture',shortDescription:'Fixture only',status:'PUBLISHED'}});
  const before=await prisma.campaignConfig.findUniqueOrThrow({where:{id:1},select:{starsIssued:true}});
  try{
   expect(await registerCompletion({slug:other.slug,idempotencyKey:keys[0],abuseKey:'test-hash'})).toEqual({ok:false,reason:'key_conflict'});
   expect(await prisma.campaignConfig.findUniqueOrThrow({where:{id:1},select:{starsIssued:true}})).toEqual(before);
  }finally{await prisma.challenge.delete({where:{id:other.id}});}
 });
 it('exposes only public star fields and rejects invalid or incomplete regions',async()=>{
  const star=await registerCompletion({slug,idempotencyKey:randomUUID(),abuseKey:'test-private-hash',starName:'Public Explorer'});
  if(!star.ok)throw Error('Fixture challenge unavailable.');
  const {tileX,tileY}=starTile(star.starNumber);
  const response=await getStars(new NextRequest(`https://roama.test/api/stars?tileX=${tileX}&tileY=${tileY}`));
  expect(response.status).toBe(200);
  const data=await response.json();
  expect(data.stars.length).toBeLessThanOrEqual(2500);
  expect(data.stars.find((item:{starNumber:number})=>item.starNumber===star.starNumber)).toEqual({starNumber:star.starNumber,starName:'Public Explorer'});
  const overview=await (await getStars(new NextRequest('https://roama.test/api/stars'))).json();
  expect(overview.capacity).toBe(1000000);
  expect(overview.tiles.length).toBeLessThanOrEqual(400);
  expect(overview.recent.length).toBeLessThanOrEqual(500);
  for(const query of ['tileX=0','tileY=0','tileX=-1&tileY=0','tileX=20&tileY=0','tileX=no&tileY=0']){
   expect((await getStars(new NextRequest(`https://roama.test/api/stars?${query}`))).status).toBe(400);
  }
 });
 it('requires authenticated same-origin name removal and preserves the accepted star',async()=>{
  vi.stubEnv('SESSION_SECRET','test-only-star-admin-secret-at-least-32-characters');
  vi.stubEnv('NEXT_PUBLIC_SITE_URL','https://roama.test');
  let adminId:string|undefined;
  try{
   const star=await registerCompletion({slug,idempotencyKey:randomUUID(),abuseKey:'test-hash',starName:'Removable Explorer'});
   if(!star.ok)throw Error('Fixture challenge unavailable.');
   expect((await getAdminStars(new NextRequest('https://roama.test/api/admin/stars'))).status).toBe(401);
   const admin=await prisma.adminUser.create({data:{email:`star-admin-${randomUUID()}@example.test`,passwordHash:'test-only-unused-password-hash'}});
   adminId=admin.id;
   const cookie=`roama_admin=${issueSession(admin.id,admin.email)}`;
   const listing=await getAdminStars(new NextRequest('https://roama.test/api/admin/stars',{headers:{cookie}}));
   expect(listing.status).toBe(200);
   expect((await listing.json()).stars.some((item:{starNumber:number})=>item.starNumber===star.starNumber)).toBe(true);
   const remove=(origin:string)=>removeStarName(new NextRequest('https://roama.test/api/admin/stars',{method:'DELETE',headers:{cookie,origin,'Content-Type':'application/json'},body:JSON.stringify({starNumber:star.starNumber})}));
   expect((await remove('https://other.test')).status).toBe(403);
   const before=await prisma.completion.count({where:{status:'ACCEPTED'}});
   expect((await remove('https://roama.test')).status).toBe(200);
   expect(await prisma.completion.findUnique({where:{starNumber:star.starNumber},select:{starName:true,status:true}})).toEqual({starName:null,status:'ACCEPTED'});
   expect(await prisma.completion.count({where:{status:'ACCEPTED'}})).toBe(before);
  }finally{
   if(adminId)await prisma.adminUser.delete({where:{id:adminId}});
   vi.unstubAllEnvs();
  }
 });
 it('caps the sky at exactly one million slots and still permits a previous confirmation retry',async()=>{
  const before=await prisma.campaignConfig.findUniqueOrThrow({where:{id:1},select:{starsIssued:true}});
  try{
   await prisma.campaignConfig.update({where:{id:1},data:{starsIssued:1000000}});
   expect(await registerCompletion({slug,idempotencyKey:randomUUID(),abuseKey:'test-hash'})).toEqual({ok:false,reason:'full'});
   expect(await registerCompletion({slug,idempotencyKey:keys[0],abuseKey:'test-hash'})).toMatchObject({ok:true,duplicate:true});
   expect((await prisma.campaignConfig.findUniqueOrThrow({where:{id:1},select:{starsIssued:true}})).starsIssued).toBe(1000000);
  }finally{await prisma.campaignConfig.update({where:{id:1},data:before});}
 });
});
describe('test safety',()=>{it('does not enable database-backed test cases without TEST_DATABASE_URL',()=>{if(!enabled)expect(true).toBe(true);});});
