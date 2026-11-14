import {afterEach,describe,expect,it,vi} from 'vitest';
import {trackEvent} from '@/lib/client-analytics';

afterEach(()=>vi.unstubAllGlobals());

describe('anonymous browser payload',()=>{
  it('sends only allowlisted event and source without browser storage, IDs or user agent',async()=>{
    const fetch=vi.fn().mockResolvedValue({ok:true});
    const storage=vi.fn(()=>{throw Error('Storage must not be used.');});
    vi.stubGlobal('fetch',fetch);
    vi.stubGlobal('window',{
      location:{pathname:'/challenge/shadow-signal',search:'?utm_source=whatsapp&ref=unique-session&utm_content=private-person'},
      get sessionStorage(){return storage();},
      get localStorage(){return storage();},
    });
    trackEvent('challenge_start',{slug:'shadow-signal',target:'private-target'});
    await Promise.resolve();
    expect(storage).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith('/api/events',expect.objectContaining({
      body:JSON.stringify({event:'challenge_start:shadow-signal',source:'wa'}),
    }));
    expect(JSON.stringify(fetch.mock.calls)).not.toMatch(/ref=|unique-session|private-person|private-target/);
  });
});
