import {describe,expect,it,vi} from 'vitest';
import {shareFileOrLink} from '@/lib/share-card';

describe('riddle card sharing',()=>{
  const file=()=>new File(['card'], 'riddle-card.png',{type:'image/png'});
  const payload:ShareData={title:'ROAMA Signal Quest',text:'What could this be?',url:'https://signalquest.roama.tech/challenge/shadow-signal?ref=e9d8c221-b899-47fc-9dc7-9e03ebfd12de'};

  it('shares the generated image and tracked challenge URL when file sharing is supported',async()=>{
    const share=vi.fn<(data:ShareData)=>Promise<void>>().mockResolvedValue();
    const canShare=vi.fn<(data:ShareData)=>boolean>().mockReturnValue(true);
    await expect(shareFileOrLink(file(),payload,share,canShare)).resolves.toBe('file');
    expect(canShare).toHaveBeenCalledWith({files:[expect.objectContaining({name:'riddle-card.png'})]});
    expect(share).toHaveBeenCalledWith({...payload,files:[expect.objectContaining({name:'riddle-card.png'})]});
  });

  it('falls back to the tracked challenge link when image file sharing is unavailable',async()=>{
    const share=vi.fn<(data:ShareData)=>Promise<void>>().mockResolvedValue();
    await expect(shareFileOrLink(file(),payload,share,()=>false)).resolves.toBe('link');
    expect(share).toHaveBeenCalledWith(payload);
  });

  it('does not report a dismissed native share sheet as a completed share',async()=>{
    const cancelled=vi.fn<(data:ShareData)=>Promise<void>>().mockRejectedValue(new DOMException('Dismissed','AbortError'));
    await expect(shareFileOrLink(file(),payload,cancelled,()=>true)).rejects.toMatchObject({name:'AbortError'});
  });
});
