import {describe,expect,it,vi} from 'vitest';
const transaction=vi.hoisted(()=>vi.fn());
vi.mock('@/lib/prisma',()=>({prisma:{$transaction:transaction}}));
import {POST} from '@/app/api/android-waitlist/route';

describe('closed Android signup endpoint',()=>{
  it('rejects all signups without reading emails, writing or deleting records',async()=>{
    const response=await POST();
    expect(response.status).toBe(410);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({error:'Android launch signups are closed. No email was collected.'});
    expect(transaction).not.toHaveBeenCalled();
  });
});
