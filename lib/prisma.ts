import {PrismaClient} from '@/generated/prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
const globalForPrisma=globalThis as unknown as {prisma?:PrismaClient};
const connectionString=process.env.DATABASE_URL||'postgresql://not-configured:not-configured@127.0.0.1:1/not-configured';
export const prisma=globalForPrisma.prisma??new PrismaClient({adapter:new PrismaPg({connectionString,max:10,connectionTimeoutMillis:5000})});
if(process.env.NODE_ENV!=='production')globalForPrisma.prisma=prisma;
