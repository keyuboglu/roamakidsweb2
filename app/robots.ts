import type { MetadataRoute } from 'next';
import {getCanonicalOrigin} from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  const origin=getCanonicalOrigin();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin','/admin/','/api/','/verify-email','/verify-email/'],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
