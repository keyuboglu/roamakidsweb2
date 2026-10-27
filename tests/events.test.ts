import {beforeEach,describe,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';

const mocks=vi.hoisted(()=>({
  create:vi.fn(),
  challengeFindFirst:vi.fn(),
  sameOrigin:vi.fn(),
  rateLimit:vi.fn(),
  abuseKey:vi.fn(),
}));

vi.mock('@/lib/prisma',()=>({prisma:{
  analyticsEvent:{create:mocks.create},
  challenge:{findFirst:mocks.challengeFindFirst},
}}));
vi.mock('@/lib/session',()=>({isSameOrigin:mocks.sameOrigin}));
vi.mock('@/lib/rate-limit',()=>({rateLimit:mocks.rateLimit,abuseKey:mocks.abuseKey}));

import {POST} from '@/app/api/events/route';

function request(body:unknown,headers:Record<string,string>={}) {
  return new NextRequest('https://signalquest.test/api/events',{
    method:'POST',
    headers:{origin:'https://signalquest.test','content-type':'application/json',...headers},
    body:JSON.stringify(body),
  });
}

describe('campaign event endpoint',()=>{
  beforeEach(()=>{
    vi.clearAllMocks();
    mocks.sameOrigin.mockReturnValue(true);
    mocks.rateLimit.mockResolvedValue(true);
    mocks.abuseKey.mockReturnValue('hashed-network-key');
    mocks.challengeFindFirst.mockResolvedValue({id:'challenge-id'});
    mocks.create.mockResolvedValue({id:'event-id'});
  });

  it('rejects cross-origin event requests',async()=>{
    mocks.sameOrigin.mockReturnValue(false);
    expect((await POST(request({event:'page_view'}))).status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('validates event names and target categories',async()=>{
    expect((await POST(request({event:'invented_event'}))).status).toBe(400);
    expect((await POST(request({event:'share',target:'private@example.com'}))).status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('applies the existing database-backed analytics limit',async()=>{
    mocks.rateLimit.mockResolvedValue(false);
    expect((await POST(request({event:'page_view'}))).status).toBe(200);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('stores sanitized aggregate attribution without private token or email values',async()=>{
    const response=await POST(request({
      event:'challenge_view',
      slug:'shadow-signal',
      source:'tiktok',
      medium:'organic_social',
      campaign:'roama_signal_quest_launch',
      content:'shadow_wall_creature_a',
      referralCode:'e9d8c221-b899-47fc-9dc7-9e03ebfd12de',
      target:'challenge_link_share',
      email:'adult@example.com',
      token:'b'.repeat(64),
      childName:'Private Child Name',
    }));
    expect(response.status).toBe(200);
    expect(mocks.challengeFindFirst).toHaveBeenCalledWith({where:{slug:'shadow-signal',status:'PUBLISHED'},select:{id:true}});
    expect(mocks.create).toHaveBeenCalledWith({data:{
      type:'CHALLENGE_VIEW',
      challengeId:'challenge-id',
      source:'tiktok',
      medium:'organic_social',
      campaign:'roama_signal_quest_launch',
      content:'shadow_wall_creature_a',
      referralCode:'e9d8c221-b899-47fc-9dc7-9e03ebfd12de',
      target:'challenge_link_share',
    }});
    const privateValue='adult@example.com';
    const token='a'.repeat(64);
    mocks.create.mockClear();
    await POST(request({event:'page_view',source:privateValue,campaign:token}));
    expect(mocks.create).toHaveBeenCalledWith({data:{
      type:'PAGE_VIEW',
      challengeId:undefined,
      target:undefined,
    }});
    expect(JSON.stringify(mocks.create.mock.calls)).not.toContain(privateValue);
    expect(JSON.stringify(mocks.create.mock.calls)).not.toContain(token);
    expect(JSON.stringify(mocks.create.mock.calls)).not.toContain('Private Child Name');
  });
});
