import type { MetadataRoute } from 'next';
import {prisma} from '@/lib/prisma';
export const dynamic='force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
 const base=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';
 let slugs:string[]=[];try{slugs=(await prisma.challenge.findMany({where:{status:'PUBLISHED'},select:{slug:true}})).map(x=>x.slug);}catch{}
 return [{url:base,lastModified:new Date(),changeFrequency:'daily',priority:1},...slugs.map(slug=>({url:`${base}/challenge/${slug}`,lastModified:new Date(),changeFrequency:'weekly' as const,priority:.7}))];
}
