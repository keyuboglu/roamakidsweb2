import {NextRequest} from 'next/server';import {prisma} from '@/lib/prisma';import {readSession} from '@/lib/session';
export async function requireAdmin(req:NextRequest){const session=readSession(req);if(!session)return null;const user=await prisma.adminUser.findUnique({where:{id:session.id},select:{id:true,email:true}}).catch(()=>null);return user&&user.email===session.email?user:null;}
