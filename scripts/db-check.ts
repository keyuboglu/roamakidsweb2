import 'dotenv/config';import {prisma} from '../lib/prisma';
async function main(){await prisma.$queryRaw`SELECT 1`;console.log('Database connection is healthy.');}
main().catch(()=>{console.error('Database check failed. Verify DATABASE_URL and PostgreSQL availability.');process.exitCode=1;}).finally(()=>prisma.$disconnect());
