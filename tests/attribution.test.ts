import {describe,expect,it,vi} from 'vitest';
import {appendAttribution,captureAttribution,readAttribution,sanitizeAttribution,secureReferralCode,trackedChallengeUrl} from '@/lib/attribution';
import {containImage,RIDDLE_CARD_COPY,RIDDLE_CARD_FORMATS} from '@/lib/riddle-cards';

describe('campaign attribution',()=>{
  it('keeps only sanitized campaign labels across untagged navigation and reloads in a tab session',()=>{
    const values=new Map<string,string>();
    const storage={getItem:(key:string)=>values.get(key)||null,setItem:(key:string,value:string)=>{values.set(key,value);}};
    const expected={source:'tiktok',medium:'social',campaign:'launch',content:'shadow_a'};
    expect(captureAttribution('?utm_source=tiktok&utm_medium=social&utm_campaign=launch&utm_content=shadow_a&email=private@example.test&token=secret',storage)).toEqual(expected);
    expect(captureAttribution('',storage)).toEqual(expected);
    expect([...values.values()].join('')).not.toContain('email');
    expect([...values.values()].join('')).not.toContain('secret');
    expect(captureAttribution('?utm_source=instagram',storage)).toEqual({source:'instagram'});
    expect(captureAttribution('',storage)).toEqual({source:'instagram'});
  });

  it('falls back to memory with a warning when browser storage is blocked',()=>{
    const warning=vi.spyOn(console,'warn').mockImplementation(()=>{});
    try {
      const storage={getItem:()=>{throw new Error('blocked');},setItem:()=>{throw new Error('blocked');}};
      expect(captureAttribution('?utm_source=creator',storage)).toEqual({source:'creator'});
      expect(captureAttribution('',storage)).toEqual({source:'creator'});
      expect(warning).toHaveBeenCalled();
    } finally {
      warning.mockRestore();
    }
  });
  it('sanitizes campaign labels and accepts only anonymous UUID referral codes',()=>{
    expect(sanitizeAttribution({
      source:' tiktok ',
      medium:'organic_social',
      campaign:'roama_signal_quest_launch',
      content:'shadow_wall_creature_a',
      referralCode:'e9d8c221-b899-47fc-9dc7-9e03ebfd12de',
    })).toEqual({
      source:'tiktok',
      medium:'organic_social',
      campaign:'roama_signal_quest_launch',
      content:'shadow_wall_creature_a',
      referralCode:'e9d8c221-b899-47fc-9dc7-9e03ebfd12de',
    });
    expect(sanitizeAttribution({
      source:'adult@example.com',
      content:'bad creative!',
      referralCode:'known-family',
      campaign:'a'.repeat(64),
    })).toEqual({});
  });

  it('reads supported UTM parameters and the ref code from a URL',()=>{
    expect(readAttribution('?utm_source=creator_slug&utm_medium=creator&utm_campaign=launch&utm_content=micro_zoomout_a&ref=e9d8c221-b899-47fc-9dc7-9e03ebfd12de&email=private%40example.com')).toEqual({
      source:'creator_slug',
      medium:'creator',
      campaign:'launch',
      content:'micro_zoomout_a',
      referralCode:'e9d8c221-b899-47fc-9dc7-9e03ebfd12de',
    });
  });

  it('creates a tracked challenge link with a secure random referral code and preserves attribution',()=>{
    const url=new URL(trackedChallengeUrl('/challenge/gravity-defier',{
      source:'signal_card',
      medium:'share',
      campaign:'roama_signal_quest_launch',
      content:'gravity_defier',
    },'gravity-defier'),'https://signalquest.roama.tech');
    expect(url.pathname).toBe('/challenge/gravity-defier');
    expect(url.searchParams.get('utm_source')).toBe('signal_card');
    expect(url.searchParams.get('utm_content')).toBe('gravity_defier');
    expect(url.searchParams.get('ref')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    const preserved=new URL(trackedChallengeUrl('/challenge/shadow-signal',{
      source:'creator',
      medium:'video',
      campaign:'launch',
      content:'shadow_a',
      referralCode:'e9d8c221-b899-47fc-9dc7-9e03ebfd12de',
    },'shadow-signal'),'https://signalquest.roama.tech');
    expect(preserved.searchParams.get('ref')).toBe('e9d8c221-b899-47fc-9dc7-9e03ebfd12de');
  });

  it('uses cryptographically secure random bytes when randomUUID is unavailable',()=>{
    const cryptoFallback={getRandomValues:(bytes:Uint8Array)=>{bytes.set(Array.from({length:16},(_,index)=>index));return bytes;}};
    expect(secureReferralCode(cryptoFallback)).toBe('00010203-0405-4607-8809-0a0b0c0d0e0f');
    expect(()=>secureReferralCode({})).toThrow(/secure invitation/i);
  });

  it('rejects external destinations when building a tracked link',()=>{
    expect(()=>trackedChallengeUrl('//example.com/path',{},'shadow-signal')).toThrow(/local path/i);
    expect(()=>trackedChallengeUrl('https://example.com',{},'shadow-signal')).toThrow(/local path/i);
  });

  it('carries attribution through public star links without replacing the star lookup',()=>{
    const url=new URL(appendAttribution('/stars?star=17',{
      source:'creator_slug',
      medium:'creator',
      campaign:'launch',
      content:'shadow_wall_creature_a',
      referralCode:'e9d8c221-b899-47fc-9dc7-9e03ebfd12de',
    }),'https://signalquest.roama.tech');
    expect(url.searchParams.get('star')).toBe('17');
    expect(url.searchParams.get('utm_source')).toBe('creator_slug');
    expect(url.searchParams.get('utm_content')).toBe('shadow_wall_creature_a');
    expect(url.searchParams.get('ref')).toBe('e9d8c221-b899-47fc-9dc7-9e03ebfd12de');
  });
});

describe('riddle card formats',()=>{
  it('defines the requested PNG export dimensions and challenge prompts',()=>{
    expect(RIDDLE_CARD_FORMATS).toMatchObject({
      landscape:{width:1200,height:630},
      story:{width:1080,height:1920},
    });
    expect(RIDDLE_CARD_COPY['shadow-signal']).toEqual({hook:'What could this be?',supporting:'Your home is full of signals.',hookInArtwork:true});
    expect(RIDDLE_CARD_COPY['micro-world-safari']).toEqual({hook:'Can you guess what this tiny world belongs to?',supporting:'Look closer. Discover the extraordinary.'});
    expect(RIDDLE_CARD_COPY['gravity-defier']).toEqual({hook:"This shouldn't balance… but does it?",supporting:'Three safe objects. One surprising challenge.'});
  });

  it('contains portrait artwork in landscape and story frames without cropping or stretching',()=>{
    const landscape=containImage(661,793,52,48,434,534);
    expect(landscape.x).toBeCloseTo(52);
    expect(landscape.width).toBeCloseTo(434);
    expect(landscape.height).toBeLessThan(534);
    expect(landscape.width/landscape.height).toBeCloseTo(661/793);
    const story=containImage(661,793,80,196,920,990);
    expect(story.height).toBeCloseTo(990);
    expect(story.width).toBeLessThan(920);
    expect(story.width/story.height).toBeCloseTo(661/793);
    expect(()=>containImage(0,793,0,0,100,100)).toThrow(/positive/);
  });
});
