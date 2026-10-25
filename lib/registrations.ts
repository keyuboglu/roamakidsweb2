import {randomUUID} from 'node:crypto';
import {Prisma} from '@roama/prisma-client';
import {prisma} from '@/lib/prisma';
import {STAR_CAPACITY} from '@/lib/stars';

class ConstellationFullError extends Error {}

type ClaimInput={challengeId:string;idempotencyKey:string;abuseKey:string;adultEmailHash:string;starName?:string|null};
type Transaction=Prisma.TransactionClient;

async function createStar(tx:Transaction,input:ClaimInput) {
  const {starsIssued}=await tx.campaignConfig.upsert({
    where:{id:1},create:{id:1,starsIssued:1},
    update:{starsIssued:{increment:1}},select:{starsIssued:true},
  });
  if(starsIssued>STAR_CAPACITY)throw new ConstellationFullError();
  const star=await tx.completion.create({
    data:{
      challengeId:input.challengeId,
      idempotencyKey:input.idempotencyKey,
      abuseKey:input.abuseKey,
      adultEmailHash:input.adultEmailHash,
      emailVerifiedAt:new Date(),
      starNumber:starsIssued,
      starName:input.starName||null,
    },
    select:{starNumber:true,starName:true},
  });
  await tx.analyticsEvent.create({data:{type:'COMPLETION_ACCEPTED',challengeId:input.challengeId}});
  const count=await tx.completion.count({where:{status:'ACCEPTED',emailVerifiedAt:{not:null}}});
  return {ok:true as const,count,duplicate:false,...star};
}

function isUniqueConstraint(error:unknown) {
  return typeof error==='object'&&error!==null&&'code' in error&&error.code==='P2002';
}

async function existingStar(adultEmailHash:string) {
  const star=await prisma.completion.findUnique({
    where:{adultEmailHash},
    select:{starNumber:true,starName:true},
  });
  if(!star)return null;
  return {
    ok:true as const,
    count:await prisma.completion.count({where:{status:'ACCEPTED',emailVerifiedAt:{not:null}}}),
    duplicate:true,
    ...star,
  };
}

export async function registerVerifiedCompletion(input:{slug:string;idempotencyKey:string;abuseKey:string;adultEmailHash:string;starName?:string}) {
  if(!/^[a-f0-9]{64}$/i.test(input.adultEmailHash))throw new Error('A verified adult email digest is required.');
  const challenge=await prisma.challenge.findFirst({where:{slug:input.slug,status:'PUBLISHED'},select:{id:true}});
  if(!challenge)return {ok:false as const,reason:'unavailable' as const};
  try {
    return await prisma.$transaction(tx=>createStar(tx,{...input,challengeId:challenge.id}),{maxWait:30000,timeout:30000});
  } catch(error) {
    if(isUniqueConstraint(error)||error instanceof ConstellationFullError){
      const prior=await prisma.completion.findFirst({
        where:{OR:[{idempotencyKey:input.idempotencyKey},{adultEmailHash:input.adultEmailHash}]},
        select:{idempotencyKey:true,adultEmailHash:true,starNumber:true,starName:true},
      });
      if(prior?.adultEmailHash===input.adultEmailHash){
        return {ok:true as const,count:await prisma.completion.count({where:{status:'ACCEPTED',emailVerifiedAt:{not:null}}}),duplicate:true,starNumber:prior.starNumber,starName:prior.starName};
      }
      if(prior?.idempotencyKey===input.idempotencyKey)return {ok:false as const,reason:'key_conflict' as const};
      if(isUniqueConstraint(error))return {ok:false as const,reason:'key_conflict' as const};
      return {ok:false as const,reason:'full' as const};
    }
    throw error;
  }
}

export async function redeemEmailVerificationToken(tokenHash:string,abuseKey:string) {
  if(!/^[a-f0-9]{64}$/i.test(tokenHash))return {ok:false as const,reason:'invalid' as const};
  const now=new Date();
  try {
    return await prisma.$transaction(async tx=>{
      const token=await tx.emailVerificationToken.findUnique({where:{tokenHash}});
      if(!token)return {ok:false as const,reason:'invalid' as const};
      if(token.consumedAt)return {ok:false as const,reason:'used' as const};
      if(token.expiresAt<=now)return {ok:false as const,reason:'expired' as const};
      const consumed=await tx.emailVerificationToken.updateMany({
        where:{id:token.id,consumedAt:null,expiresAt:{gt:now}},
        data:{consumedAt:now},
      });
      if(consumed.count!==1){
        const current=await tx.emailVerificationToken.findUnique({where:{id:token.id},select:{consumedAt:true,expiresAt:true}});
        return !current
          ?{ok:false as const,reason:'invalid' as const}
          :current.expiresAt<=now
            ?{ok:false as const,reason:'expired' as const}
            :{ok:false as const,reason:'used' as const};
      }
      const prior=await tx.completion.findUnique({
        where:{adultEmailHash:token.adultEmailHash},
        select:{starNumber:true,starName:true},
      });
      if(prior){
        return {
          ok:true as const,
          count:await tx.completion.count({where:{status:'ACCEPTED',emailVerifiedAt:{not:null}}}),
          duplicate:true,
          ...prior,
        };
      }
      return createStar(tx,{
        challengeId:token.challengeId,
        idempotencyKey:randomUUID(),
        abuseKey,
        adultEmailHash:token.adultEmailHash,
        starName:token.starName,
      });
    },{maxWait:30000,timeout:30000});
  } catch(error) {
    if(error instanceof ConstellationFullError)return {ok:false as const,reason:'full' as const};
    if(isUniqueConstraint(error)){
      await prisma.emailVerificationToken.updateMany({where:{tokenHash,consumedAt:null},data:{consumedAt:new Date()}});
      const prior=await existingStar((await prisma.emailVerificationToken.findUnique({where:{tokenHash},select:{adultEmailHash:true}}))?.adultEmailHash||'');
      if(prior)return prior;
    }
    throw error;
  }
}
