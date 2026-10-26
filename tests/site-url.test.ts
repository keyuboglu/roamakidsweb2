import {describe,expect,it} from 'vitest';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import {serializeJsonLd} from '@/lib/json-ld';
import {getCanonicalOrigin,PRODUCTION_SITE_URL} from '@/lib/site-url';

describe('canonical site origin',()=>{
  it('uses the production campaign origin when unset or invalid outside development',()=>{
    expect(getCanonicalOrigin(undefined,'production')).toBe(PRODUCTION_SITE_URL);
    expect(getCanonicalOrigin('not a URL','production')).toBe(PRODUCTION_SITE_URL);
    expect(getCanonicalOrigin('http://localhost:3000','production')).toBe(PRODUCTION_SITE_URL);
    expect(getCanonicalOrigin('https://campaign.workers.dev','production')).toBe(PRODUCTION_SITE_URL);
  });

  it('uses a valid HTTPS origin and rejects URL paths or credentials',()=>{
    expect(getCanonicalOrigin('https://signalquest.roama.tech/','production')).toBe(PRODUCTION_SITE_URL);
    expect(getCanonicalOrigin('https://signalquest.roama.tech/path','production')).toBe(PRODUCTION_SITE_URL);
  });

  it('allows a local development origin only in development',()=>{
    expect(getCanonicalOrigin('http://localhost:3001','development')).toBe('http://localhost:3001');
    expect(getCanonicalOrigin(undefined,'development')).toBe('http://localhost:3000');
    expect(getCanonicalOrigin('http://localhost:3001','production')).toBe(PRODUCTION_SITE_URL);
  });

  it('keeps robots and sitemap URLs on the canonical production host',async()=>{
    const robotRules=robots();
    expect(robotRules.sitemap).toBe(`${PRODUCTION_SITE_URL}/sitemap.xml`);
    expect(robotRules.rules).toMatchObject({allow:'/',disallow:expect.arrayContaining(['/api/','/admin/','/verify-email/'])});
    const entries=await sitemap();
    expect(entries.map(entry=>entry.url)).toEqual([
      PRODUCTION_SITE_URL,
      `${PRODUCTION_SITE_URL}/stars`,
      `${PRODUCTION_SITE_URL}/privacy`,
      `${PRODUCTION_SITE_URL}/challenge/shadow-signal`,
      `${PRODUCTION_SITE_URL}/challenge/micro-world-safari`,
      `${PRODUCTION_SITE_URL}/challenge/gravity-defier`,
    ]);
    expect(entries.filter(entry=>entry.lastModified).every(entry=>{
      const value=entry.lastModified instanceof Date?entry.lastModified.toISOString():entry.lastModified;
      return value==='2026-10-26T00:00:00.000Z';
    })).toBe(true);
  });

  it('escapes script-closing content in structured data',()=>{
    const serialized=serializeJsonLd({description:'</script><script>alert(1)</script>'});
    expect(serialized).not.toContain('</script>');
    expect(JSON.parse(serialized).description).toBe('</script><script>alert(1)</script>');
  });
});
