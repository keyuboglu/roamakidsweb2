import {describe,expect,it} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import AppBridge from '@/components/AppBridge';
import AppDownloadCTA from '@/components/AppDownloadCTA';
import {LanguageProvider} from '@/components/FunnelPreferences';
import {appStoreUrl} from '@/lib/brand';
import {challengeShareText,challengeShareUrl} from '@/lib/challenge-share';

function render(language:'en'|'tr',element:React.ReactNode) {
  return renderToStaticMarkup(createElement(LanguageProvider,{language},element));
}

describe('app store and grown-up challenge sharing',()=>{
  it('uses the owner-provided provider attribution for homepage and completion store links',()=>{
    expect(appStoreUrl()).toBe('https://apps.apple.com/app/apple-store/id6815158079?pt=129427648&ct=signalquest&mt=8');
    expect(appStoreUrl('signalquest_complete')).toBe('https://apps.apple.com/app/apple-store/id6815158079?pt=129427648&ct=signalquest_complete&mt=8');
  });

  it('renders the App Store destination immediately while retaining the adult Android waitlist',()=>{
    const markup=render('en',createElement(AppDownloadCTA));
    expect(markup).toContain('Continue the Adventure on the App Store');
    expect(markup).toContain('Coming soon on Google Play');
    expect(markup).toContain('Adult email address');
    expect(markup).not.toContain('Loading app options');
  });

  it('uses the completion-specific App Store attribution and Pip bridge copy',()=>{
    const markup=render('en',createElement(AppBridge,{completion:true,slug:'shadow-signal'}));
    expect(markup).toContain('Loved this? Continue the adventure with Pip in ROAMA Kids.');
    expect(markup).toContain('ct=signalquest_complete');
    const turkish=render('tr',createElement(AppBridge,{completion:true}));
    expect(turkish).toContain('Pip ile maceraya devam edin');
  });

  it('shares the selected challenge language and tags public links with utm_source=share',()=>{
    const url=new URL(challengeShareUrl('shadow-signal','en'));
    expect(url.origin).toBe('https://signalquest.roama.tech');
    expect(url.pathname).toBe('/challenge/shadow-signal');
    expect(url.searchParams.get('lang')).toBe('en');
    expect(url.searchParams.get('utm_source')).toBe('share');
    expect(challengeShareText('The Shadow Signal','en')).toBe('We just did The Shadow Signal — a free screen-free challenge for 6–12s');
    expect(challengeShareText('Gölge Sinyali','tr')).toContain('6–12 yaş');
  });
});
