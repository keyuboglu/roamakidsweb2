import {afterEach,describe,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
import {POST as verifyEmail} from '@/app/api/verification/verify/route';

describe('email verification feature gate',()=>{
  afterEach(()=>vi.unstubAllEnvs());

  it('does not redeem a previously issued link while claims are disabled',async()=>{
    vi.stubEnv('NEXT_PUBLIC_SITE_URL','https://roama.test');
    vi.stubEnv('STAR_CLAIMS_ENABLED','false');

    const response=await verifyEmail(new NextRequest('https://roama.test/api/verification/verify',{
      method:'POST',
      headers:{origin:'https://roama.test','content-type':'application/json'},
      body:JSON.stringify({token:'a'.repeat(64)}),
    }));

    expect(response.status).toBe(503);
    expect((await response.json()).error).toMatch(/no star was created/i);
  });
});
