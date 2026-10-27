export type RiddleCardFormat='landscape'|'story';

export const RIDDLE_CARD_FORMATS={
  landscape:{width:1200,height:630,label:'landscape card (1200 × 630)'},
  story:{width:1080,height:1920,label:'story card (1080 × 1920)'},
} as const;

export const RIDDLE_CARD_COPY:Record<string,{hook:string;supporting:string;hookInArtwork?:boolean}>={
  'shadow-signal':{hook:'What could this be?',supporting:'Your home is full of signals.',hookInArtwork:true},
  'micro-world-safari':{hook:'Can you guess what this tiny world belongs to?',supporting:'Look closer. Discover the extraordinary.'},
  'gravity-defier':{hook:"This shouldn't balance… but does it?",supporting:'Three safe objects. One surprising challenge.'},
} as const;

export function containImage(sourceWidth:number,sourceHeight:number,x:number,y:number,width:number,height:number) {
  if(sourceWidth<=0||sourceHeight<=0||width<=0||height<=0)throw new Error('Image dimensions must be positive.');
  const scale=Math.min(width/sourceWidth,height/sourceHeight);
  const fittedWidth=sourceWidth*scale;
  const fittedHeight=sourceHeight*scale;
  return {x:x+(width-fittedWidth)/2,y:y+(height-fittedHeight)/2,width:fittedWidth,height:fittedHeight};
}
