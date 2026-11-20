import {prisma} from '@/lib/prisma';

/**
 * The one rule for a counted star: an accepted completion whose adult organizer verified their email.
 * Every public count (the homepage, /api/campaign, /api/verified-stars and roama.tech/great-signal) reads this.
 */
export const VERIFIED_STAR_WHERE={status:'ACCEPTED' as const,emailVerifiedAt:{not:null}};

export type VerifiedStarSnapshot={count:number;checkedAt:Date};

const PUBLIC_MAX_AGE_MS=30_000;
let cached:VerifiedStarSnapshot|null=null;

/** Counts verified stars. Public readers may reuse a count up to 30 s old; pass maxAgeMs 0 for a fresh count. */
export async function verifiedStars({maxAgeMs=PUBLIC_MAX_AGE_MS,now=new Date()}:{maxAgeMs?:number;now?:Date}={}):Promise<VerifiedStarSnapshot> {
  if(cached&&maxAgeMs>0&&now.getTime()-cached.checkedAt.getTime()<maxAgeMs)return cached;
  const count=await prisma.completion.count({where:VERIFIED_STAR_WHERE});
  cached={count,checkedAt:now};
  return cached;
}

/** Server rendering never waits long on the database: null after `ms`, and the browser refreshes the count. */
export async function verifiedStarCountWithin(ms:number):Promise<number|null> {
  let timer:ReturnType<typeof setTimeout>|undefined;
  try {
    const timeout=new Promise<null>(resolve=>{timer=setTimeout(()=>resolve(null),ms);});
    const snapshot=await Promise.race([verifiedStars(),timeout]);
    return snapshot?snapshot.count:null;
  } catch(error) {
    console.error('Verified star count unavailable for server rendering.',error instanceof Error?error.message.replace(/postgres(?:ql)?:\/\/[^\s]+/g,'[redacted-database-url]'):'Unknown error');
    return null;
  } finally {
    if(timer)clearTimeout(timer);
  }
}

export function resetVerifiedStarCacheForTests() {
  cached=null;
}
