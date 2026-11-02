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
      `${PRODUCTION_SITE_URL}/?lang=en`,
      `${PRODUCTION_SITE_URL}/stars?lang=en`,
      `${PRODUCTION_SITE_URL}/privacy?lang=en`,
      `${PRODUCTION_SITE_URL}/challenge/shadow-signal?lang=en`,
      `${PRODUCTION_SITE_URL}/challenge/micro-world-safari?lang=en`,
      `${PRODUCTION_SITE_URL}/challenge/gravity-defier?lang=en`,
    ]);
    expect(entries.filter(entry=>entry.lastModified).map(entry=>({
      url:entry.url,
      lastModified:entry.lastModified instanceof Date?entry.lastModified.toISOString():entry.lastModified,
    }))).toEqual([
      {url:`${PRODUCTION_SITE_URL}/?lang=en`,lastModified:'2026-10-29T00:00:00.000Z'},
      {url:`${PRODUCTION_SITE_URL}/privacy?lang=en`,lastModified:'2026-10-29T00:00:00.000Z'},
      {url:`${PRODUCTION_SITE_URL}/challenge/shadow-signal?lang=en`,lastModified:'2026-10-29T00:00:00.000Z'},
      {url:`${PRODUCTION_SITE_URL}/challenge/micro-world-safari?lang=en`,lastModified:'2026-10-29T00:00:00.000Z'},
      {url:`${PRODUCTION_SITE_URL}/challenge/gravity-defier?lang=en`,lastModified:'2026-10-29T00:00:00.000Z'},
    ]);
    expect(entries[0].alternates).toEqual({languages:{
      en:`${PRODUCTION_SITE_URL}/?lang=en`,
      tr:`${PRODUCTION_SITE_URL}/?lang=tr`,
      'x-default':`${PRODUCTION_SITE_URL}/?lang=en`,
    }});
  });

  it('escapes script-closing content in structured data',()=>{
    const serialized=serializeJsonLd({description:'</script><script>alert(1)</script>'});
    expect(serialized).not.toContain('</script>');
    expect(JSON.parse(serialized).description).toBe('</script><script>alert(1)</script>');
  });
});
