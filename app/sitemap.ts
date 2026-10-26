import type { MetadataRoute } from 'next';
import {campaignChallenges} from '@/lib/challenge-content';
export const dynamic='force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
 const base=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';
 return [{url:base,lastModified:new Date(),changeFrequency:'daily',priority:1},{url:`${base}/stars`,changeFrequency:'daily',priority:.9},...campaignChallenges.map(({slug})=>({url:`${base}/challenge/${slug}`,lastModified:new Date(),changeFrequency:'weekly' as const,priority:.7}))];
}
