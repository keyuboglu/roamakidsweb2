import {afterEach,describe,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
import {abuseKey} from '@/lib/rate-limit';

describe('proxy network keys',()=>{
  afterEach(()=>vi.unstubAllEnvs());

  it('uses the Cloudflare address instead of client-controlled proxy headers',()=>{
    vi.stubEnv('CLOUDFLARE_WORKER','true');
    vi.stubEnv('ABUSE_HASH_SECRET','test-only-abuse-secret-with-at-least-32-characters');
    const request=(spoofed:string)=>new NextRequest('https://quest.example.test',{
      headers:{'cf-connecting-ip':'192.0.2.1','x-real-ip':spoofed,'x-forwarded-for':spoofed},
    });
    expect(abuseKey(request('192.0.2.2'))).toBe(abuseKey(request('192.0.2.3')));
  });

  it('preserves the Node hosting proxy behavior outside Workers',()=>{
    vi.stubEnv('CLOUDFLARE_WORKER','false');
    vi.stubEnv('ABUSE_HASH_SECRET','test-only-abuse-secret-with-at-least-32-characters');
    const request=(address:string)=>new NextRequest('https://quest.example.test',{
      headers:{'cf-connecting-ip':'192.0.2.1','x-real-ip':address},
    });
    expect(abuseKey(request('192.0.2.2'))).not.toBe(abuseKey(request('192.0.2.3')));
  });
});
