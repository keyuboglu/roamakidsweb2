import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {abuseKey,rateLimit} from '@/lib/rate-limit';
import {prisma} from '@/lib/prisma';
import {STAR_CAPACITY,STAR_TILE_COUNT,starTileRanges,type StarTile} from '@/lib/stars';
import {GREAT_SIGNAL_START,GREAT_SIGNAL_END,isGreatSignalStar} from '@/lib/great-signal';

export const dynamic='force-dynamic';
const tileSchema=z.object({
  tileX:z.coerce.number().int().min(0).max(STAR_TILE_COUNT-1),
  tileY:z.coerce.number().int().min(0).max(STAR_TILE_COUNT-1),
});

export async function GET(req:NextRequest) {
  const params=req.nextUrl.searchParams;
  const eventOnly=params.get('layer')==='great-signal-2026';
  const eventWhere={status:'ACCEPTED' as const,emailVerifiedAt:{gte:GREAT_SIGNAL_START,lt:GREAT_SIGNAL_END},challenge:{slug:'shadow-signal'}};
  const publicStar=(star:{starNumber:number;starName:string|null;emailVerifiedAt:Date|null;challenge:{slug:string}})=>{
    const greatSignal=isGreatSignalStar(star.challenge.slug,star.emailVerifiedAt);
    return {starNumber:star.starNumber,starName:greatSignal?null:star.starName,greatSignal};
  };
  try {
    if(!await rateLimit(`star-lookup:${abuseKey(req)}`,120,3600)){
      return NextResponse.json({error:'Too many star lookups. Please wait and try again.'},{status:429,headers:{'Cache-Control':'no-store'}});
    }
    if(params.has('tileX')||params.has('tileY')){
      const tile=tileSchema.safeParse(Object.fromEntries(params));
      if(!tile.success)return NextResponse.json({error:'Choose a valid star-map region.'},{status:400});
      const stars=await prisma.completion.findMany({
        where:{...(eventOnly?eventWhere:{status:'ACCEPTED',emailVerifiedAt:{not:null}}),OR:starTileRanges(tile.data.tileX,tile.data.tileY)},
        select:{starNumber:true,starName:true,emailVerifiedAt:true,challenge:{select:{slug:true}}},orderBy:{starNumber:'asc'},take:2500,
      });
      return NextResponse.json({stars:stars.map(publicStar)},{headers:{'Cache-Control':'public, max-age=15'}});
    }
    const [allTiles,recent,eventTiles,countries]=await Promise.all([
      prisma.$queryRaw<StarTile[]>`
        SELECT (("starNumber"-1)%1000/50)::INTEGER AS "tileX",
               (("starNumber"-1)/1000/50)::INTEGER AS "tileY",
               COUNT(*)::INTEGER AS count
        FROM "Completion" WHERE "status"='ACCEPTED' AND "emailVerifiedAt" IS NOT NULL
        GROUP BY 1,2
      `,
      prisma.completion.findMany({where:eventOnly?eventWhere:{status:'ACCEPTED',emailVerifiedAt:{not:null}},select:{starNumber:true,starName:true,emailVerifiedAt:true,challenge:{select:{slug:true}}},orderBy:{starNumber:'desc'},take:500}),
      prisma.$queryRaw<StarTile[]>`
        SELECT ((c."starNumber"-1)%1000/50)::INTEGER AS "tileX",
               ((c."starNumber"-1)/1000/50)::INTEGER AS "tileY", COUNT(*)::INTEGER AS count
        FROM "Completion" c JOIN "Challenge" h ON h.id=c."challengeId"
        WHERE c.status='ACCEPTED' AND h.slug='shadow-signal'
          AND c."emailVerifiedAt">=${GREAT_SIGNAL_START} AND c."emailVerifiedAt"<${GREAT_SIGNAL_END}
        GROUP BY 1,2
      `,
      prisma.completion.groupBy({by:['countryCode'],where:{...eventWhere,countryCode:{not:null}},_count:true}),
    ]);
    const tiles=eventOnly?eventTiles:allTiles;
    return NextResponse.json({capacity:STAR_CAPACITY,count:allTiles.reduce((sum,tile)=>sum+tile.count,0),tiles,recent:recent.map(publicStar),greatSignal:{total:eventTiles.reduce((sum,tile)=>sum+tile.count,0),countries:countries.length,tiles:eventTiles}},{headers:{'Cache-Control':'public, max-age=15'}});
  } catch(error) {
    console.error('Star map data unavailable.',error instanceof Error?error.name:'UnknownError');
    return NextResponse.json({error:'The star map could not connect. Please try again.'},{status:503});
  }
}
