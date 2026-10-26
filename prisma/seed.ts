import 'dotenv/config';
import {campaignChallenges} from '../lib/challenge-content';
import {prisma} from '../lib/prisma';

async function main() {
  await prisma.$transaction(async tx=>{
    await tx.campaignConfig.upsert({where:{id:1},create:{id:1},update:{}});
    for(const challenge of campaignChallenges){
      await tx.challenge.upsert({
        where:{slug:challenge.slug},
        create:{
          slug:challenge.slug,
          title:challenge.title,
          shortDescription:challenge.shortDescription,
          description:challenge.description,
          instructions:challenge.instructions,
          safety:challenge.safety,
          imageUrl:challenge.imageUrl,
          duration:challenge.duration,
          status:'PUBLISHED',
          displayOrder:challenge.displayOrder,
          publishedAt:new Date(),
        },
        update:{},
      });
    }
  });
  console.log('Campaign settings and built-in challenges initialized. No participation data was seeded.');
}

main().catch(error=>{
  console.error('Campaign seed failed.',error instanceof Error?error.name:'UnknownError');
  process.exitCode=1;
}).finally(()=>prisma.$disconnect());
