import type { MetadataRoute } from 'next';
import {campaignChallenges} from '@/lib/challenge-content';
import {getCanonicalOrigin} from '@/lib/site-url';
export const dynamic='force-dynamic';

const siteContentLastModified=new Date('2026-10-26T00:00:00.000Z');
const challengeContentLastModified=new Date('2026-10-27T00:00:00.000Z');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
 const base=getCanonicalOrigin();
 return [
  {url:base,lastModified:siteContentLastModified,changeFrequency:'weekly',priority:1},
  {url:`${base}/stars`,changeFrequency:'monthly',priority:.6},
  {url:`${base}/privacy`,lastModified:siteContentLastModified,changeFrequency:'monthly',priority:.3},
  ...campaignChallenges.map(({slug})=>({
   url:`${base}/challenge/${slug}`,
   lastModified:challengeContentLastModified,
   changeFrequency:'monthly' as const,
   priority:.7,
  })),
 ];
}
