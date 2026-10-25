import {prisma} from '@/lib/prisma';
import {STAR_CAPACITY} from '@/lib/stars';

class ConstellationFullError extends Error {}

export async function registerCompletion(input:{slug:string;idempotencyKey:string;abuseKey:string;starName?:string}) {
  const challenge=await prisma.challenge.findFirst({where:{slug:input.slug,status:'PUBLISHED'},select:{id:true}});
  if(!challenge)return {ok:false as const,reason:'unavailable' as const};
  try {
    return await prisma.$transaction(async tx=>{
      // A transactional counter reserves a unique slot and rolls back on retries.
      const {starsIssued}=await tx.campaignConfig.upsert({
        where:{id:1},create:{id:1,starsIssued:1},
        update:{starsIssued:{increment:1}},select:{starsIssued:true},
      });
      if(starsIssued>STAR_CAPACITY)throw new ConstellationFullError();
      const star=await tx.completion.create({
        data:{challengeId:challenge.id,idempotencyKey:input.idempotencyKey,abuseKey:input.abuseKey,starNumber:starsIssued,starName:input.starName||null},
        select:{starNumber:true,starName:true},
      });
      await tx.analyticsEvent.create({data:{type:'COMPLETION_ACCEPTED',challengeId:challenge.id}});
      const count=await tx.completion.count({where:{status:'ACCEPTED'}});
      return {ok:true as const,count,duplicate:false,...star};
    },{maxWait:30000,timeout:30000});
  } catch(error) {
    const duplicate=typeof error==='object'&&error!==null&&'code' in error&&error.code==='P2002';
    if(duplicate||error instanceof ConstellationFullError){
      const prior=await prisma.completion.findUnique({
        where:{idempotencyKey:input.idempotencyKey},
        select:{challengeId:true,starNumber:true,starName:true},
      });
      if(prior&&prior.challengeId===challenge.id){
        return {ok:true as const,count:await prisma.completion.count({where:{status:'ACCEPTED'}}),duplicate:true,starNumber:prior.starNumber,starName:prior.starName};
      }
      return {ok:false as const,reason:prior?'key_conflict' as const:error instanceof ConstellationFullError?'full' as const:'key_conflict' as const};
    }
    throw error;
  }
}
