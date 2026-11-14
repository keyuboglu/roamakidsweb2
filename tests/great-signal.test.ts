import {describe,expect,it} from 'vitest';
import {isGreatSignalDate,isGreatSignalStar} from '@/lib/great-signal';
import {campaignChallenges,mergeCampaignChallenges} from '@/lib/challenge-content';

describe('The Great Signal 2026',()=>{
  it('uses the exact Istanbul window including the start and excluding the end',()=>{
    expect(isGreatSignalDate(new Date('2026-12-19T20:59:59.999Z'))).toBe(false);
    expect(isGreatSignalDate(new Date('2026-12-19T21:00:00Z'))).toBe(true);
    expect(isGreatSignalDate(new Date('2026-12-22T20:59:59.999Z'))).toBe(true);
    expect(isGreatSignalDate(new Date('2026-12-22T21:00:00Z'))).toBe(false);
  });
  it('requires a Shadow Signal star verified in the window, not any other challenge or unverified star',()=>{
    expect(isGreatSignalStar('shadow-signal',new Date('2026-12-20T12:00:00Z'))).toBe(true);
    expect(isGreatSignalStar('gravity-defier',new Date('2026-12-20T12:00:00Z'))).toBe(false);
    expect(isGreatSignalStar('shadow-signal',null)).toBe(false);
    expect(isGreatSignalStar('shadow-signal',new Date('2026-11-14'))).toBe(false);
  });
  it('keeps the approved app mission authoritative over stale database overrides',()=>{
    const shadow=campaignChallenges[0];
    expect(mergeCampaignChallenges([{...shadow,title:'Old title',instructions:'Old instructions'}])[0]).toEqual(shadow);
    expect(shadow.instructions).toContain('using your hands');
    expect(shadow.instructions).toContain('one minute');
    expect(shadow.instructions).not.toMatch(/torch|flashlight/i);
    expect(shadow.instructions.split('\n').filter(line=>/^\d/.test(line)).every(line=>line.includes('With a grown-up'))).toBe(true);
  });
});
