import {afterEach,describe,expect,it,vi} from 'vitest';
import {detectDevice,detectLanguage,daysUntilAndroidLaunch,localizedPath,FAMILY_CHALLENGE_MESSAGE} from '@/lib/funnel';
import {campaignChallenges} from '@/lib/challenge-content';
import {turkishChallenges} from '@/lib/challenge-translations';
import {encryptWaitlistEmail,decryptWaitlistEmail,waitlistEmailHash} from '@/lib/android-waitlist';
import {adultEmailDigest,sendVerificationEmail} from '@/lib/email-verification';

afterEach(()=>{
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('device and language funnel selection',()=>{
  it('distinguishes Android, iPhone, iPad and desktop-mode iPadOS from desktops',()=>{
    expect(detectDevice('Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36')).toBe('android');
    expect(detectDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe('ios');
    expect(detectDevice('Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)')).toBe('ios');
    const mac='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15';
    expect(detectDevice(mac,5)).toBe('ios');
    expect(detectDevice(mac,0)).toBe('desktop');
    expect(detectDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64)',10)).toBe('desktop');
  });

  it('honors explicit languages, Turkish browsers and English fallback',()=>{
    expect(detectLanguage('?lang=tr','en-US')).toBe('tr');
    expect(detectLanguage('','tr-TR')).toBe('tr');
    expect(detectLanguage('?lang=en','tr-TR')).toBe('en');
    expect(detectLanguage('?lang=fr','fr-FR')).toBe('en');
    expect(detectLanguage('','de-DE')).toBe('en');
    expect(localizedPath('/challenge/shadow-signal?utm_source=tiktok#steps','tr')).toBe('/challenge/shadow-signal?utm_source=tiktok&lang=tr#steps');
    expect(localizedPath('/#challenges','tr')).toBe('/?lang=tr#challenges');
    expect(localizedPath('/#challenges','en')).toBe('/?lang=en#challenges');
  });

  it('uses a fixed launch date instead of resetting an eight-day promise on each visit',()=>{
    expect(daysUntilAndroidLaunch(Date.parse('2026-10-29T09:00:00+03:00'))).toBe(8);
    expect(daysUntilAndroidLaunch(Date.parse('2026-11-05T12:00:00+03:00'))).toBe(1);
    expect(daysUntilAndroidLaunch(Date.parse('2026-11-06T00:00:00+03:00'))).toBe(0);
    expect(daysUntilAndroidLaunch(Date.parse('2027-01-01T00:00:00Z'))).toBe(0);
  });

  it('preserves the main ages 6–12 message and translates all original steps and safety guidance',()=>{
    expect(FAMILY_CHALLENGE_MESSAGE).toBe('Three free, screen-free family challenges for kids ages 6–12. No app, photos or sign-up needed.');
    expect(Object.keys(turkishChallenges).sort()).toEqual(campaignChallenges.map(challenge=>challenge.slug).sort());
    for(const challenge of campaignChallenges){
      const translated=turkishChallenges[challenge.slug];
      expect(translated.instructions.split('\n').length).toBe(challenge.instructions.split('\n').length);
      expect(translated.title).toBeTruthy();
      expect(translated.safety).toBeTruthy();
      expect(translated.materials).toBeTruthy();
    }
    expect(turkishChallenges['gravity-defier'].instructions).toContain('üç saniye');
    expect(turkishChallenges['micro-world-safari'].instructions).toContain('gerekmez');
    expect(turkishChallenges['shadow-signal'].safety).toContain('Mum');
  });
});

describe('private Android email storage',()=>{
  it('requires server configuration rather than silently accepting unprotected emails',()=>{
    vi.stubEnv('ADULT_EMAIL_HASH_SECRET','');
    expect(()=>encryptWaitlistEmail('adult@example.test')).toThrow(/not configured/);
    expect(()=>waitlistEmailHash('adult@example.test')).toThrow(/not configured/);
  });

  it('encrypts recoverably with random IVs and separates its digest from star verification',()=>{
    vi.stubEnv('ADULT_EMAIL_HASH_SECRET','test-only-secret-at-least-thirty-two-characters');
    const email='adult@example.test';
    const first=encryptWaitlistEmail(email);
    expect(first).not.toContain(email);
    expect(first).not.toBe(encryptWaitlistEmail(email));
    expect(decryptWaitlistEmail(first)).toBe(email);
    expect(waitlistEmailHash(email)).toBe(waitlistEmailHash(email));
    expect(waitlistEmailHash(email)).not.toBe(adultEmailDigest(email));
    const parts=first.split('.');
    parts[2]=Buffer.alloc(16).toString('base64');
    expect(()=>decryptWaitlistEmail(parts.join('.'))).toThrow();
    vi.stubEnv('ADULT_EMAIL_HASH_SECRET','different-test-secret-at-least-thirty-two-characters');
    expect(()=>decryptWaitlistEmail(first)).toThrow();
  });

  it('localizes verification emails and preserves Turkish in a canonical fragment-token link',async()=>{
    vi.stubEnv('RESEND_API_KEY','test-only-key');
    vi.stubEnv('RESEND_FROM_EMAIL','ROAMA <info@roama.tech>');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL','https://signalquest.roama.tech');
    const fetchMock=vi.fn().mockResolvedValue({ok:true});
    vi.stubGlobal('fetch',fetchMock);
    const token='a'.repeat(64);
    expect(await sendVerificationEmail('adult@example.test',token,'tr')).toBe(true);
    const body=JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.text).toContain(`https://signalquest.roama.tech/verify-email?lang=tr#${token}`);
    expect(body.subject).toContain('doğrulayın');
    expect(body.html).not.toContain('?token=');
    await sendVerificationEmail('adult@example.test',token,'en');
    const english=JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(english.text).toContain(`/verify-email?lang=en#${token}`);
    expect(english.subject).toBe('Verify your ROAMA Signal Quest star');
  });
});
