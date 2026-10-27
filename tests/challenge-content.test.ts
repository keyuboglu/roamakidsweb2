import {describe,expect,it} from 'vitest';
import {campaignChallenges,challengeArtwork,challengeArtworkBySlug,mergeCampaignChallenges} from '@/lib/challenge-content';

describe('campaign challenges',()=>{
  it('defines the three supplied challenges with their exact local artwork paths',()=>{
    expect(campaignChallenges.map(challenge=>challenge.slug)).toEqual([
      'shadow-signal',
      'micro-world-safari',
      'gravity-defier',
    ]);
    expect(campaignChallenges.map(challenge=>challenge.imageUrl)).toEqual([
      '/images/challenges/shadow-signal.png',
      '/images/challenges/micro-world-safari.png',
      '/images/challenges/gravity-defier.png',
    ]);
    expect(Object.values(challengeArtworkBySlug)).toEqual(campaignChallenges.map(challenge=>challenge.imageUrl));
  });

  it('contains the supplied adult-facing safety guidance and optional sharing prompts',()=>{
    expect(campaignChallenges[0].safety).toContain('candles');
    expect(campaignChallenges[1].safety).toContain('unknown insects');
    expect(campaignChallenges[2].safety).toContain('glassware');
    expect(campaignChallenges.every(challenge=>challenge.optionalSharingPrompt.length>0)).toBe(true);
    expect(campaignChallenges.every(challenge=>challenge.ageGuidance.ages6to8&&challenge.ageGuidance.ages9to12)).toBe(true);
    expect(campaignChallenges.every(challenge=>challenge.estimatedTime&&challenge.materials&&challenge.imageAlt)).toBe(true);
  });

  it('uses unique search descriptions for the intended age range and activity topics',()=>{
    const descriptions=campaignChallenges.map(challenge=>challenge.seoDescription);
    expect(new Set(descriptions).size).toBe(campaignChallenges.length);
    expect(descriptions[0]).toMatch(/shadow experiment.*ages 6–12/i);
    expect(descriptions[1]).toMatch(/nature discovery.*ages 6–12/i);
    expect(descriptions[2]).toMatch(/balancing activity.*ages 6–12/i);
  });

  it('uses a known challenge image over any stored fallback and preserves unknown challenge art',()=>{
    expect(challengeArtwork('gravity-defier','/custom.png')).toBe('/images/challenges/gravity-defier.png');
    expect(challengeArtwork('other-challenge','/custom.png')).toBe('/custom.png');
    expect(challengeArtwork('other-challenge')).toBeNull();
  });

  it('uses published database copy overrides while keeping the supplied artwork fixed',()=>{
    const merged=mergeCampaignChallenges([{
      slug:'shadow-signal',
      title:'Updated title',
      shortDescription:'Updated hook',
      description:'Updated description',
      instructions:'Updated instructions',
      safety:'Updated safety',
      duration:'10 minutes',
      imageUrl:'/incorrect-upload.png',
    }]);
    expect(merged[0]).toMatchObject({
      title:'Updated title',
      shortDescription:'Updated hook',
      instructions:'Updated instructions',
      duration:'10 minutes',
      imageUrl:'/images/challenges/shadow-signal.png',
    });
    expect(merged[1].title).toBe('The Micro-World Safari');
    expect(merged[2].title).toBe('The Gravity Defier');
  });
});
