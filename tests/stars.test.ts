import {describe,expect,it} from 'vitest';
import {buildStarPixels,isStarNumber,STAR_CAPACITY,STAR_COLUMNS,STAR_ROWS,STAR_TILE_COUNT,starPosition,starTile,starTileRanges} from '@/lib/stars';
import {completionSchema} from '@/lib/completion-input';

describe('million-star map',()=>{
  it('renders exactly one million distinct star pixels, not one million DOM nodes',()=>{
    expect(STAR_COLUMNS*STAR_ROWS).toBe(1_000_000);
    const pixels=buildStarPixels();
    expect(pixels.length).toBe(2000*2000*4);
    let stars=0;
    for(let offset=3;offset<pixels.length;offset+=4)if(pixels[offset]>0)stars++;
    expect(stars).toBe(1_000_000);
  });

  it('partitions all million positions into bounded, non-overlapping regions',()=>{
    const covered=new Uint8Array(STAR_CAPACITY);
    for(let y=0;y<STAR_TILE_COUNT;y++)for(let x=0;x<STAR_TILE_COUNT;x++){
      const ranges=starTileRanges(x,y);
      expect(ranges).toHaveLength(50);
      for(const {starNumber:{gte,lte}} of ranges)for(let number=gte;number<=lte;number++){
        covered[number-1]++;
      }
    }
    expect(covered.every(count=>count===1)).toBe(true);
    expect(starTile(1)).toEqual({tileX:0,tileY:0});
    expect(starTile(1_000_000)).toEqual({tileX:19,tileY:19});
  });

  it('gives stars stable positions and rejects out-of-range numbers',()=>{
    expect(starPosition(1)).toEqual({x:6,y:6});
    expect(starPosition(1_000_000)).toEqual({x:7998,y:7998});
    for(const value of [0,-1,1.5,1_000_001,NaN,Infinity])expect(isStarNumber(value)).toBe(false);
    expect(isStarNumber(1)).toBe(true);
    expect(isStarNumber(1_000_000)).toBe(true);
  });
});

describe('public star-name consent and validation',()=>{
  const input={challengeSlug:'test-challenge',idempotencyKey:'123e4567-e89b-42d3-a456-426614174000',adultConfirmed:true};
  it('keeps unnamed registrations backward compatible',()=>{
    expect(completionSchema.safeParse(input).success).toBe(true);
  });
  it('requires explicit public-name confirmation and trims fictional names',()=>{
    expect(completionSchema.safeParse({...input,starName:'Brave Explorer'}).success).toBe(false);
    const result=completionSchema.safeParse({...input,starName:'  Brave Explorer  ',publicNameConfirmed:true});
    expect(result.success&&result.data.starName).toBe('Brave Explorer');
  });
  it('rejects contact details, markup, long numeric identifiers, and overlong names',()=>{
    for(const starName of ['test@example.com','https://example.com','<script>alert(1)</script>','Explorer 12345678','Explorer \u0661\u0662\u0663\u0664','a'.repeat(41)]){
      expect(completionSchema.safeParse({...input,starName,publicNameConfirmed:true}).success).toBe(false);
    }
  });
  it('accepts international fictional names',()=>{
    expect(completionSchema.safeParse({...input,starName:'Cesur Ka\u015fif',publicNameConfirmed:true}).success).toBe(true);
  });
});
