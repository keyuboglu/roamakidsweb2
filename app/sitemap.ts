import type { MetadataRoute } from 'next';
import {campaignChallenges} from '@/lib/challenge-content';
import {getCanonicalOrigin} from '@/lib/site-url';
export const dynamic='force-dynamic';

const contentLastModified=new Date('2026-10-26T00:00:00.000Z');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
 const base=getCanonicalOrigin();
 return [
  {url:base,lastModified:contentLastModified,changeFrequency:'weekly',priority:1},
  {url:`${base}/stars`,changeFrequency:'monthly',priority:.6},
  {url:`${base}/privacy`,lastModified:contentLastModified,changeFrequency:'monthly',priority:.3},
  ...campaignChallenges.map(({slug})=>({
   url:`${base}/challenge/${slug}`,
   lastModified:contentLastModified,
   changeFrequency:'monthly' as const,
   priority:.7,
  })),
 ];
}
