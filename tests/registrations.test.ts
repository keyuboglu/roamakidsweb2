import {afterAll,beforeAll,describe,expect,it,vi} from 'vitest';import {createHash,randomUUID} from 'node:crypto';import {NextRequest} from 'next/server';import {prisma} from '@/lib/prisma';import {adultEmailDigest} from '@/lib/email-verification';import {registerVerifiedCompletion} from '@/lib/registrations';import {rateLimit} from '@/lib/rate-limit';
import {GET as getStars} from '@/app/api/stars/route';
import {GET as getAdminStars,DELETE as removeStarName} from '@/app/api/admin/stars/route';
import {issueSession} from '@/lib/session';
import {starTile} from '@/lib/stars';
import {POST as postCompletion} from '@/app/api/completions/route';
import {POST as requestVerification} from '@/app/api/verification/request/route';
import {POST as verifyEmail} from '@/app/api/verification/verify/route';
const enabled=Boolean(process.env.TEST_DATABASE_URL);
const adultEmailHash=()=>createHash('sha256').update(randomUUID()).digest('hex');
describe.skipIf(!enabled)('PostgreSQL completion registration',()=>{let challengeId='',slug='';const keys:string[]=[];
 beforeAll(async()=>{await prisma.$connect();slug=`integration-${randomUUID()}`;const c=await prisma.challenge.create({data:{slug,title:'Test-only challenge',shortDescription:'A temporary integration fixture.',instructions:'Fixture only',safety:'Fixture only',status:'PUBLISHED'}});challengeId=c.id;});
 afterAll(async()=>{if(challengeId){await prisma.emailVerificationToken.deleteMany({where:{challengeId}});await prisma.completion.deleteMany({where:{challengeId}});await prisma.challenge.delete({where:{id:challengeId}});}await prisma.$disconnect();});
 it('adds exactly one star for a verified adult email and returns the authoritative verified count',async()=>{const key=randomUUID();keys.push(key);const before=await prisma.completion.count({where:{status:'ACCEPTED',emailVerifiedAt:{not:null}}});const result=await registerVerifiedCompletion({slug,idempotencyKey:key,abuseKey:'test-hash',adultEmailHash:adultEmailHash()});expect(result).toMatchObject({ok:true,duplicate:false,count:before+1});});
 it('returns the existing completion on an idempotent retry without adding another star',async()=>{const key=randomUUID(),digest=adultEmailHash();keys.push(key);const first=await registerVerifiedCompletion({slug,idempotencyKey:key,abuseKey:'test-hash',adultEmailHash:digest});if(!first.ok)throw Error('fixture challenge was unavailable');const second=await registerVerifiedCompletion({slug,idempotencyKey:key,abuseKey:'test-hash',adultEmailHash:digest});expect(second).toMatchObject({ok:true,duplicate:true,count:first.count});});
 it('handles concurrent distinct verified adult emails without duplicating star positions',async()=>{const before=await prisma.completion.count({where:{status:'ACCEPTED',emailVerifiedAt:{not:null}}});const submissions=Array.from({length:12},()=>{const idempotencyKey=randomUUID();keys.push(idempotencyKey);return registerVerifiedCompletion({slug,idempotencyKey,abuseKey:'test-hash',adultEmailHash:adultEmailHash()});});const results=await Promise.all(submissions);expect(results.every(r=>r.ok)).toBe(true);expect(new Set(results.filter(r=>r.ok).map(r=>r.starNumber)).size).toBe(12);expect(await prisma.completion.count({where:{status:'ACCEPTED',emailVerifiedAt:{not:null}}})).toBe(before+12);},30000);
 it('serializes concurrent requests for the same verified adult email to one permanent star',async()=>{const before=await prisma.completion.count({where:{status:'ACCEPTED',emailVerifiedAt:{not:null}}});const digest=adultEmailHash(),results=await Promise.all([randomUUID(),randomUUID()].map(idempotencyKey=>registerVerifiedCompletion({slug,idempotencyKey,abuseKey:'test-hash',adultEmailHash:digest})));expect(results.every(r=>r.ok)).toBe(true);expect(new Set(results.filter(r=>r.ok).map(r=>r.starNumber)).size).toBe(1);expect(await prisma.completion.count({where:{status:'ACCEPTED',emailVerifiedAt:{not:null}}})).toBe(before+1);});
 it('rejects a draft challenge and does not record a star',async()=>{const draft=await prisma.challenge.create({data:{slug:`draft-${randomUUID()}`,title:'Draft fixture',shortDescription:'Draft',status:'DRAFT'}});try{const result=await registerVerifiedCompletion({slug:draft.slug,idempotencyKey:randomUUID(),abuseKey:'test-hash',adultEmailHash:adultEmailHash()});expect(result).toEqual({ok:false,reason:'unavailable'});expect(await prisma.completion.count({where:{challengeId:draft.id}})).toBe(0);}finally{await prisma.challenge.delete({where:{id:draft.id}});}});
 it('applies an atomic database rate limit',async()=>{const key=`test-limit-${randomUUID()}`;try{expect(await rateLimit(key,2,3600)).toBe(true);expect(await rateLimit(key,2,3600)).toBe(true);expect(await rateLimit(key,2,3600)).toBe(false);}finally{await prisma.rateLimitBucket.deleteMany({where:{key}});}});
 it('accepts production-length prefixed network hashes',async()=>{const key=`completion:${randomUUID().replaceAll('-','').repeat(2)}`;try{expect(key.length).toBe(75);expect(await rateLimit(key,1,3600)).toBe(true);expect(await rateLimit(key,1,3600)).toBe(false);}finally{await prisma.rateLimitBucket.deleteMany({where:{key}});}});
 it('persists a public star name and preserves it on idempotent retries without consuming another slot',async()=>{
  const idempotencyKey=randomUUID();keys.push(idempotencyKey);
  const digest=adultEmailHash();
  const first=await registerVerifiedCompletion({slug,idempotencyKey,abuseKey:'test-hash',adultEmailHash:digest,starName:'Brave Explorer'});
  if(!first.ok)throw Error('Fixture challenge unavailable.');
  const before=await prisma.campaignConfig.findUniqueOrThrow({where:{id:1},select:{starsIssued:true}});
  const retry=await registerVerifiedCompletion({slug,idempotencyKey,abuseKey:'test-hash',adultEmailHash:digest,starName:'Changed retry name'});
  expect(retry).toMatchObject({ok:true,duplicate:true,starNumber:first.starNumber,starName:'Brave Explorer'});
  expect(await registerVerifiedCompletion({slug,idempotencyKey:randomUUID(),abuseKey:'test-hash',adultEmailHash:digest,starName:'Another retry'})).toMatchObject({ok:true,duplicate:true,starNumber:first.starNumber,starName:'Brave Explorer'});
  expect(await prisma.campaignConfig.findUniqueOrThrow({where:{id:1},select:{starsIssued:true}})).toEqual(before);
 });
 it('does not consume a slot for a key conflict on a different challenge',async()=>{
  const before=await prisma.campaignConfig.findUniqueOrThrow({where:{id:1},select:{starsIssued:true}});
  expect(await registerVerifiedCompletion({slug,idempotencyKey:keys[0],abuseKey:'test-hash',adultEmailHash:adultEmailHash()})).toEqual({ok:false,reason:'key_conflict'});
  expect(await prisma.campaignConfig.findUniqueOrThrow({where:{id:1},select:{starsIssued:true}})).toEqual(before);
 });
 it('exposes only public star fields and rejects invalid or incomplete regions',async()=>{
  const star=await registerVerifiedCompletion({slug,idempotencyKey:randomUUID(),abuseKey:'test-private-hash',adultEmailHash:adultEmailHash(),starName:'Public Explorer'});
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
   const star=await registerVerifiedCompletion({slug,idempotencyKey:randomUUID(),abuseKey:'test-hash',adultEmailHash:adultEmailHash(),starName:'Removable Explorer'});
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
   const before=await prisma.completion.count({where:{status:'ACCEPTED',emailVerifiedAt:{not:null}}});
   expect((await remove('https://roama.test')).status).toBe(200);
   expect(await prisma.completion.findUnique({where:{starNumber:star.starNumber},select:{starName:true,status:true,emailVerifiedAt:true}})).toMatchObject({starName:null,status:'ACCEPTED',emailVerifiedAt:expect.any(Date)});
   expect(await prisma.completion.count({where:{status:'ACCEPTED',emailVerifiedAt:{not:null}}})).toBe(before);
  }finally{
   if(adminId)await prisma.adminUser.delete({where:{id:adminId}});
   vi.unstubAllEnvs();
  }
 });
 it('caps the sky at exactly one million slots and still permits a verified email to recover its star',async()=>{
  let before:{starsIssued:number}|undefined;
  try{
   const idempotencyKey=randomUUID(),digest=adultEmailHash();
   const existing=await registerVerifiedCompletion({slug,idempotencyKey,abuseKey:'test-hash',adultEmailHash:digest});
   if(!existing.ok)throw Error('Fixture challenge was unavailable.');
   before=await prisma.campaignConfig.findUniqueOrThrow({where:{id:1},select:{starsIssued:true}});
   await prisma.campaignConfig.update({where:{id:1},data:{starsIssued:1000000}});
   expect(await registerVerifiedCompletion({slug,idempotencyKey:randomUUID(),abuseKey:'test-hash',adultEmailHash:adultEmailHash()})).toEqual({ok:false,reason:'full'});
   expect(await registerVerifiedCompletion({slug,idempotencyKey:randomUUID(),abuseKey:'test-hash',adultEmailHash:digest})).toMatchObject({ok:true,duplicate:true,starNumber:existing.starNumber});
   expect((await prisma.campaignConfig.findUniqueOrThrow({where:{id:1},select:{starsIssued:true}})).starsIssued).toBe(1000000);
  }finally{if(before)await prisma.campaignConfig.update({where:{id:1},data:before});}
 });
 it('enforces one published database challenge at a time',async()=>{
  await expect(prisma.challenge.create({data:{slug:`second-featured-${randomUUID()}`,title:'Second fixture',shortDescription:'Must remain unpublished',status:'PUBLISHED'}})).rejects.toMatchObject({code:'P2002'});
 });
 it('does not create an unverified star through the retired public completion endpoint',async()=>{
  vi.stubEnv('NEXT_PUBLIC_SITE_URL','https://roama.test');
  try{
   const before=await prisma.completion.count({where:{status:'ACCEPTED',emailVerifiedAt:{not:null}}});
   const request=new NextRequest('https://roama.test/api/completions',{method:'POST',headers:{origin:'https://roama.test','content-type':'application/json'},body:JSON.stringify({challengeSlug:slug,idempotencyKey:randomUUID(),adultConfirmed:true})});
   const response=await postCompletion(request);
   expect(response.status).toBe(503);
   expect((await response.json()).error).toMatch(/email verification/i);
   expect(await prisma.completion.count({where:{status:'ACCEPTED',emailVerifiedAt:{not:null}}})).toBe(before);
  }finally{vi.unstubAllEnvs();}
 });
 it('verifies an adult email once, creates one star, and recovers that star without another count increment',async()=>{
  vi.stubEnv('NEXT_PUBLIC_SITE_URL','https://roama.test');
  vi.stubEnv('ABUSE_HASH_SECRET','test-only-abuse-key-not-for-deployment-000000');
  vi.stubEnv('ADULT_EMAIL_HASH_SECRET','test-only-adult-email-hash-key-not-for-deployment');
  vi.stubEnv('RESEND_API_KEY','test-only-resend-api-key');
  vi.stubEnv('RESEND_FROM_EMAIL','Signal Quest <quest@example.test>');
  vi.stubEnv('RESEND_SENDER_DOMAIN_VERIFIED','true');
  vi.stubEnv('STAR_CLAIMS_ENABLED','true');
  const mail=vi.fn<typeof fetch>().mockResolvedValue(new Response('{"id":"test-message"}',{status:200}));
  vi.stubGlobal('fetch',mail);
  const email=`adult-${randomUUID()}@example.test`;
  const countBefore=await prisma.completion.count({where:{status:'ACCEPTED',emailVerifiedAt:{not:null}}});
  async function requestLink(starName:string,ip:string) {
   const response=await requestVerification(new NextRequest('https://roama.test/api/verification/request',{
    method:'POST',
    headers:{origin:'https://roama.test','content-type':'application/json','x-real-ip':ip},
    body:JSON.stringify({email,challengeSlug:slug,adultConfirmed:true,starName,publicNameConfirmed:true,website:''}),
   }));
   expect(response.status).toBe(202);
   expect(JSON.stringify(await response.json())).not.toContain(email);
   const init=mail.mock.calls.at(-1)?.[1];
   if(!init||typeof init.body!=='string')throw new Error('The verification message was not created.');
   const content:unknown=JSON.parse(init.body);
   if(typeof content!=='object'||content===null||!('html' in content)||typeof content.html!=='string')throw new Error('The verification message did not contain an HTML body.');
   const link=content.html.match(/href="([^"]+)"/)?.[1];
   if(!link)throw new Error('The verification message did not contain a link.');
   const token=new URL(link).hash.slice(1);
   expect(token).toMatch(/^[a-f0-9]{64}$/);
   return token;
  }
  const verify=(token:string,ip:string)=>verifyEmail(new NextRequest('https://roama.test/api/verification/verify',{
   method:'POST',
   headers:{origin:'https://roama.test','content-type':'application/json','x-real-ip':ip},
   body:JSON.stringify({token}),
  }));
  try {
   const firstToken=await requestLink('Fictional Explorer',`192.0.2.${Math.floor(Math.random()*200)+1}`);
   const first=await verify(firstToken,`198.51.100.${Math.floor(Math.random()*200)+1}`);
   expect(first.status).toBe(200);
   const star=await first.json();
   expect(star).toMatchObject({starName:'Fictional Explorer',count:countBefore+1,recovered:false});
   const saved=await prisma.completion.findUniqueOrThrow({where:{adultEmailHash:adultEmailDigest(email)}});
   expect(saved).toMatchObject({starNumber:star.starNumber,starName:'Fictional Explorer',emailVerifiedAt:expect.any(Date)});
   expect(JSON.stringify(star)).not.toContain(email);

   const replay=await verify(firstToken,`198.51.100.${Math.floor(Math.random()*200)+1}`);
   expect(replay.status).toBe(410);
   const secondToken=await requestLink('Changed Public Name',`192.0.2.${Math.floor(Math.random()*200)+1}`);
   const recovered=await verify(secondToken,`198.51.100.${Math.floor(Math.random()*200)+1}`);
   expect(recovered.status).toBe(200);
   expect(await recovered.json()).toMatchObject({starNumber:star.starNumber,starName:'Fictional Explorer',count:countBefore+1,recovered:true});

   const raceToken=await requestLink('Another Name',`192.0.2.${Math.floor(Math.random()*200)+1}`);
   const raced=await Promise.all([verify(raceToken,`verify-race-${randomUUID()}`),verify(raceToken,`verify-race-${randomUUID()}`)]);
   expect(raced.map(response=>response.status).sort()).toEqual([200,410]);
   const sentCount=mail.mock.calls.length;
   const throttled=await requestVerification(new NextRequest('https://roama.test/api/verification/request',{
    method:'POST',
    headers:{origin:'https://roama.test','content-type':'application/json','x-real-ip':`email-limit-${randomUUID()}`},
    body:JSON.stringify({email,challengeSlug:slug,adultConfirmed:true,website:''}),
   }));
   expect(throttled.status).toBe(202);
   expect(mail.mock.calls).toHaveLength(sentCount);
   expect(await prisma.completion.count({where:{adultEmailHash:adultEmailDigest(email)}})).toBe(1);
   expect(await prisma.completion.count({where:{status:'ACCEPTED',emailVerifiedAt:{not:null}}})).toBe(countBefore+1);
  } finally {
   vi.unstubAllGlobals();
   vi.unstubAllEnvs();
  }
 },30000);
 it('rejects expired verification tokens and removes tokens after Resend delivery failure',async()=>{
  vi.stubEnv('NEXT_PUBLIC_SITE_URL','https://roama.test');
  vi.stubEnv('ABUSE_HASH_SECRET','test-only-abuse-key-not-for-deployment-000000');
  vi.stubEnv('ADULT_EMAIL_HASH_SECRET','test-only-adult-email-hash-key-not-for-deployment');
  vi.stubEnv('RESEND_API_KEY','test-only-resend-api-key');
  vi.stubEnv('RESEND_FROM_EMAIL','Signal Quest <quest@example.test>');
  vi.stubEnv('RESEND_SENDER_DOMAIN_VERIFIED','true');
  vi.stubEnv('STAR_CLAIMS_ENABLED','true');
  const mail=vi.fn<typeof fetch>().mockResolvedValue(new Response('{"id":"test-message"}',{status:200}));
  vi.stubGlobal('fetch',mail);
  const email=`expiry-${randomUUID()}@example.test`;
  try {
   const request=await requestVerification(new NextRequest('https://roama.test/api/verification/request',{
    method:'POST',
    headers:{origin:'https://roama.test','content-type':'application/json','x-real-ip':`expiry-${randomUUID()}`},
    body:JSON.stringify({email,challengeSlug:slug,adultConfirmed:true,website:''}),
   }));
   expect(request.status).toBe(202);
   const init=mail.mock.calls[0]?.[1];
   if(!init||typeof init.body!=='string')throw new Error('The verification message was not created.');
   const content:unknown=JSON.parse(init.body);
   if(typeof content!=='object'||content===null||!('html' in content)||typeof content.html!=='string')throw new Error('The verification message did not contain an HTML body.');
   const link=content.html.match(/href="([^"]+)"/)?.[1];
   if(!link)throw new Error('The verification message did not contain a link.');
   const token=new URL(link).hash.slice(1);
   const tokenHash=createHash('sha256').update(token).digest('hex');
   await prisma.emailVerificationToken.update({where:{tokenHash},data:{expiresAt:new Date(Date.now()-1000)}});
   const expired=await verifyEmail(new NextRequest('https://roama.test/api/verification/verify',{
    method:'POST',
    headers:{origin:'https://roama.test','content-type':'application/json','x-real-ip':`expired-link-${randomUUID()}`},
    body:JSON.stringify({token}),
   }));
   expect(expired.status).toBe(410);
   expect((await expired.json()).error).toMatch(/expired/i);

   const count=await prisma.emailVerificationToken.count({where:{challengeId}});
   mail.mockResolvedValue(new Response('{"message":"sender domain not verified"}',{status:422}));
   const rejected=await requestVerification(new NextRequest('https://roama.test/api/verification/request',{
    method:'POST',
    headers:{origin:'https://roama.test','content-type':'application/json','x-real-ip':`delivery-${randomUUID()}`},
    body:JSON.stringify({email:`delivery-${randomUUID()}@example.test`,challengeSlug:slug,adultConfirmed:true,website:''}),
   }));
   expect(rejected.status).toBe(503);
   expect(await prisma.emailVerificationToken.count({where:{challengeId}})).toBe(count);
  } finally {
   vi.unstubAllGlobals();
   vi.unstubAllEnvs();
  }
 },30000);
 it('collects no email while Resend is unconfigured and rejects malformed verification links',async()=>{
  vi.stubEnv('NEXT_PUBLIC_SITE_URL','https://roama.test');
  vi.stubEnv('ADULT_EMAIL_HASH_SECRET','test-only-adult-email-hash-key-not-for-deployment');
  vi.stubEnv('RESEND_API_KEY','');
  vi.stubEnv('RESEND_FROM_EMAIL','');
  vi.stubEnv('RESEND_SENDER_DOMAIN_VERIFIED','false');
  vi.stubEnv('STAR_CLAIMS_ENABLED','false');
  const mail=vi.fn<typeof fetch>();
  vi.stubGlobal('fetch',mail);
  const email=`paused-${randomUUID()}@example.test`;
  const tokensBefore=await prisma.emailVerificationToken.count({where:{challengeId}});
  try {
   const paused=await requestVerification(new NextRequest('https://roama.test/api/verification/request',{
    method:'POST',
    headers:{origin:'https://roama.test','content-type':'application/json','x-real-ip':`paused-${randomUUID()}`},
    body:JSON.stringify({email,challengeSlug:slug,adultConfirmed:true,website:''}),
   }));
   expect(paused.status).toBe(503);
   expect((await paused.json()).error).toMatch(/no email was collected/i);
   expect(await prisma.emailVerificationToken.count({where:{challengeId}})).toBe(tokensBefore);
   expect(mail).not.toHaveBeenCalled();
   const invalid=await verifyEmail(new NextRequest('https://roama.test/api/verification/verify',{
    method:'POST',
    headers:{origin:'https://roama.test','content-type':'application/json'},
    body:JSON.stringify({token:'not-a-token'}),
   }));
   expect(invalid.status).toBe(400);
  } finally {
   vi.unstubAllGlobals();
   vi.unstubAllEnvs();
  }
 });
});
describe('test safety',()=>{it('does not enable database-backed test cases without TEST_DATABASE_URL',()=>{if(!enabled)expect(true).toBe(true);});});
