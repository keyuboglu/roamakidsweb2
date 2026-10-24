import 'dotenv/config';import {prisma} from '../lib/prisma';
async function main(){await prisma.campaignConfig.upsert({where:{id:1},create:{id:1},update:{}});console.log('Campaign settings initialized. No challenge activities were seeded.');}
main().finally(()=>prisma.$disconnect());
