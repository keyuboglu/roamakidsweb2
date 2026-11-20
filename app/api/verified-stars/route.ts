import {NextResponse} from 'next/server';
import {STAR_CAPACITY} from '@/lib/stars';
import {verifiedStars} from '@/lib/verified-stars';

export const dynamic='force-dynamic';

/** Public, read-only: the single verified star count, for roama.tech/great-signal and anyone else. */
const PUBLIC_HEADERS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET'};
const RULE='A star is counted when a child completes a Signal Quest challenge and the adult organizer verifies their email.';

export async function GET() {
  try {
    const {count,checkedAt}=await verifiedStars();
    return NextResponse.json({count,goal:STAR_CAPACITY,rule:RULE,checkedAt:checkedAt.toISOString()},
      {headers:{...PUBLIC_HEADERS,'Cache-Control':'public, max-age=30'}});
  } catch(error) {
    console.error('Verified star count request failed.',error instanceof Error?error.message.replace(/postgres(?:ql)?:\/\/[^\s]+/g,'[redacted-database-url]'):'Unknown error');
    return NextResponse.json({count:null,goal:STAR_CAPACITY,rule:RULE,error:'The verified star count is temporarily unavailable.'},
      {status:503,headers:{...PUBLIC_HEADERS,'Cache-Control':'no-store'}});
  }
}
