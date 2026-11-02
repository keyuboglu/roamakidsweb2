import type { MetadataRoute } from 'next';
import {campaignChallenges} from '@/lib/challenge-content';
import {getCanonicalOrigin} from '@/lib/site-url';
export const dynamic='force-dynamic';

const siteContentLastModified=new Date('2026-10-29T00:00:00.000Z');
const challengeContentLastModified=new Date('2026-10-29T00:00:00.000Z');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
 const base=getCanonicalOrigin();
 const pages=[
  {path:'/',lastModified:siteContentLastModified,changeFrequency:'weekly' as const,priority:1},
  {path:'/stars',changeFrequency:'monthly' as const,priority:.6},
  {path:'/privacy',lastModified:siteContentLastModified,changeFrequency:'monthly' as const,priority:.3},
  ...campaignChallenges.map(({slug})=>({path:`/challenge/${slug}`,lastModified:challengeContentLastModified,changeFrequency:'monthly' as const,priority:.7})),
 ];
 return pages.map(({path,...page})=>({
  ...page,
  url:`${base}${path}?lang=en`,
  alternates:{languages:{en:`${base}${path}?lang=en`,tr:`${base}${path}?lang=tr`,'x-default':`${base}${path}?lang=en`}},
 }));
}
