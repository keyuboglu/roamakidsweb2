export type Attribution={
  source?:string;
  medium?:string;
  campaign?:string;
  content?:string;
  referralCode?:string;
};

const valuePattern=/^[a-zA-Z0-9._-]+$/;
const referralPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const keys={
  source:'utm_source',
  medium:'utm_medium',
  campaign:'utm_campaign',
  content:'utm_content',
  referralCode:'ref',
} as const;
type SecureCryptoApi={randomUUID?:()=>string;getRandomValues?:(values:Uint8Array)=>Uint8Array};

function cleanValue(value:unknown) {
  if(typeof value!=='string')return undefined;
  const cleaned=value.trim();
  return cleaned.length>0&&cleaned.length<=100&&valuePattern.test(cleaned)&&! /^[a-f0-9]{32,}$/i.test(cleaned)?cleaned:undefined;
}

export function sanitizeAttribution(value:unknown):Attribution {
  if(typeof value!=='object'||value===null)return {};
  const input=value as Record<string,unknown>;
  const source=cleanValue(input.source);
  const medium=cleanValue(input.medium);
  const campaign=cleanValue(input.campaign);
  const content=cleanValue(input.content);
  const candidate=cleanValue(input.referralCode);
  return {
    ...(source?{source}:{}),
    ...(medium?{medium}:{}),
    ...(campaign?{campaign}:{}),
    ...(content?{content}:{}),
    ...(candidate&&referralPattern.test(candidate)?{referralCode:candidate.toLowerCase()}:{}),
  };
}

export function readAttribution(search:string):Attribution {
  const params=new URLSearchParams(search);
  return sanitizeAttribution({
    source:params.get(keys.source),
    medium:params.get(keys.medium),
    campaign:params.get(keys.campaign),
    content:params.get(keys.content),
    referralCode:params.get(keys.referralCode),
  });
}

const storageKey='roama-campaign-attribution-v1';
let sessionAttribution:Attribution={};

export function captureAttribution(search:string,storage?:Pick<Storage,'getItem'|'setItem'>):Attribution {
  const incoming=readAttribution(search);
  try {
    const saved=storage?.getItem(storageKey);
    if(saved)sessionAttribution=sanitizeAttribution(JSON.parse(saved));
  } catch {
    console.warn('Campaign session attribution could not be read.');
  }
  // A new tagged arrival replaces the previous campaign; untagged navigation retains it.
  if(Object.keys(incoming).length){
    sessionAttribution=incoming;
    try {
      storage?.setItem(storageKey,JSON.stringify(incoming));
    } catch {
      console.warn('Campaign session attribution could not be saved.');
    }
  }
  return {...sessionAttribution};
}

export function currentAttribution():Attribution {
  if(typeof window==='undefined')return {};
  let storage:Storage|undefined;
  try {
    storage=window.sessionStorage;
  } catch {
    console.warn('Campaign session storage is unavailable; using in-memory attribution.');
  }
  return captureAttribution(window.location.search,storage);
}

export function secureReferralCode(cryptoApi:SecureCryptoApi|undefined=globalThis.crypto) {
  if(!cryptoApi)throw new Error('Secure invitation links are unavailable in this browser.');
  if(typeof cryptoApi.randomUUID==='function')return cryptoApi.randomUUID();
  if(typeof cryptoApi.getRandomValues!=='function')throw new Error('Secure invitation links are unavailable in this browser.');
  const bytes=cryptoApi.getRandomValues(new Uint8Array(16));
  bytes[6]=(bytes[6]&0x0f)|0x40;
  bytes[8]=(bytes[8]&0x3f)|0x80;
  const hex=Array.from(bytes,value=>value.toString(16).padStart(2,'0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

export function trackedChallengeUrl(path:string,attribution:Attribution,slug:string) {
  if(!path.startsWith('/')||path.startsWith('//'))throw new Error('A tracked challenge link must be a local path.');
  const tracked=sanitizeAttribution(attribution);
  const source=tracked.source||'signal_card';
  const medium=tracked.medium||'share';
  const campaign=tracked.campaign||'roama_signal_quest_launch';
  const content=tracked.content||slug;
  return appendAttribution(path,{
    source,
    medium,
    campaign,
    content,
    referralCode:tracked.referralCode||secureReferralCode(),
  });
}

export function appendAttribution(path:string,attribution:Attribution) {
  if(!path.startsWith('/')||path.startsWith('//'))throw new Error('Attribution can only be appended to a local path.');
  const [pathname,query='']=path.split('?');
  const params=new URLSearchParams(query);
  const sanitized=sanitizeAttribution(attribution);
  const fields:[keyof Attribution,string][]=[
    ['source',keys.source],
    ['medium',keys.medium],
    ['campaign',keys.campaign],
    ['content',keys.content],
    ['referralCode',keys.referralCode],
  ];
  for(const [field,key] of fields){
    const value=sanitized[field];
    if(value)params.set(key,value);
  }
  return params.size?`${pathname}?${params.toString()}`:pathname;
}

export function attributionFields(attribution:Attribution) {
  return {
    source:attribution.source,
    medium:attribution.medium,
    campaign:attribution.campaign,
    content:attribution.content,
    referralCode:attribution.referralCode,
  };
}
