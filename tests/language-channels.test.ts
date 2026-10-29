import {describe,expect,it,vi} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {NextRequest} from 'next/server';
import {LanguageProvider} from '@/components/FunnelPreferences';
import Quest from '@/components/Quest';
import LanguageSwitch from '@/components/LanguageSwitch';
import ChallengeDetail from '@/components/ChallengeDetail';
import StarMap from '@/components/StarMap';
import VerifyEmail from '@/components/VerifyEmail';
import {campaignChallenges} from '@/lib/challenge-content';
import {localizedPath,type Language} from '@/lib/funnel';
import {middleware} from '@/middleware';

vi.mock('next/navigation',()=>({usePathname:()=>'/challenge/shadow-signal'}));

function render(language:Language,element:React.ReactNode) {
  return renderToStaticMarkup(createElement(LanguageProvider,{language},element));
}

describe('separate public language channels',()=>{
  it('pins English and Turkish links explicitly and preserves query, hash, and verification fragments',()=>{
    expect(localizedPath('/stars?star=42&utm_source=tiktok&lang=tr#map','en')).toBe('/stars?star=42&utm_source=tiktok&lang=en#map');
    expect(localizedPath('/verify-email?lang=en#'+'a'.repeat(64),'tr')).toBe('/verify-email?lang=tr#'+'a'.repeat(64));
    expect(localizedPath('/#challenges','en')).toBe('/?lang=en#challenges');
  });

  it('renders the selected homepage language on the server, without English CMS copy leaking into Turkish',()=>{
    const initialData={configured:true,count:2,goal:1000000,headline:'A MILLION STARS. ONE GLOBAL QUEST.',description:'English-only admin description',milestones:[{threshold:100,label:'First light'}],challenges:[...campaignChallenges]};
    const tr=render('tr',createElement(Quest,{initialData}));
    expect(tr).toContain('BİR MİLYON YILDIZ.');
    expect(tr).toContain('NASIL');
    expect(tr).toContain('Gizlilik bilgileri');
    for(const text of ['English-only admin description','First light','CHOOSE YOUR ADVENTURE','For Parents','Explore the star map','LIVE COUNT','Privacy information','How It Works'])expect(tr).not.toContain(text);
    const en=render('en',createElement(Quest,{initialData}));
    expect(en).toContain('CHOOSE YOUR ADVENTURE');
    expect(en).toContain('English-only admin description');
    for(const text of ['BİR MİLYON','Göreve başla','Gizlilik bilgileri','MACERANIZI SEÇİN'])expect(en).not.toContain(text);
  });

  it('renders Turkish-only instructions, share controls, star map and verification controls',()=>{
    for(const challenge of campaignChallenges){
      const tr=render('tr',createElement(ChallengeDetail,{challenge,verificationEnabled:true}));
      expect(tr).toContain('Bilmeceyi yanınıza alın');
      expect(tr).toContain('Görev bağlantısını kopyala');
      for(const text of ['The Great Signal Quest','Take the riddle with you','Share card','Completed this challenge?'])expect(tr).not.toContain(text);
    }
    const map=render('tr',createElement(StarMap));
    expect(map).toContain('Bir yıldız bul');
    expect(map).not.toContain('Find a star');
    expect(map).not.toContain('Privacy information');
    const verify=render('tr',createElement(VerifyEmail));
    expect(verify).toContain('E-postamı doğrula');
    expect(verify).not.toContain('ADULT EMAIL CONFIRMATION');
  });

  it('offers top-level links with active-language semantics on the current page',()=>{
    const tr=render('tr',createElement(LanguageSwitch));
    expect(tr).toContain('Dil seçimi');
    expect(tr).toContain('href="/challenge/shadow-signal?lang=en"');
    expect(tr).toContain('href="/challenge/shadow-signal?lang=tr"');
    expect(tr).toContain('lang="tr" aria-current="true"');
  });

  it('uses explicit channel parameters before browser preference and prevents spoofed server language headers',()=>{
    for(const [query,accept,expected] of [
      ['?lang=en','tr-TR,tr;q=0.9','en'],
      ['?lang=tr','en-US,en;q=0.9','tr'],
      ['','tr-TR,tr;q=0.9','tr'],
      ['','fr-FR,fr;q=0.9','en'],
    ]){
      const response=middleware(new NextRequest(`https://signalquest.roama.tech/${query}`,{headers:{'accept-language':accept,'x-roama-language':expected==='tr'?'en':'tr'}}));
      expect(response.headers.get('x-middleware-request-x-roama-language')).toBe(expected);
    }
  });
});
