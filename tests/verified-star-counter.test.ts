import {describe,expect,it,vi} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const state=vi.hoisted(()=>({star:{starNumber:1,starName:null,count:2,recovered:true}}));
vi.mock('react',async importOriginal=>{
  const actual=await importOriginal<typeof import('react')>();
  return {...actual,useState:(initial:unknown)=>initial===null?[state.star,vi.fn()]:actual.useState(initial)};
});
vi.mock('next/navigation',()=>({usePathname:()=>'/verify-email'}));
import VerifyEmail from '@/components/VerifyEmail';

describe('verified-star success counter',()=>{
  it('uses the same threshold on verification success as on the homepage and map',()=>{
    for(const count of [2,99,100]){
      state.star.count=count;
      const markup=renderToStaticMarkup(createElement(VerifyEmail));
      expect(markup.includes('Help us light the first 100 stars')).toBe(count<100);
      expect(markup.includes(`${count} verified adult-email star claims`)).toBe(count>=100);
      expect(markup).not.toContain('type="email"');
      expect(markup).toContain('ct=signalquest');
    }
  });
});
