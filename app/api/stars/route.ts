import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {STAR_CAPACITY,STAR_TILE_COUNT,starTileRanges,type StarTile} from '@/lib/stars';

export const dynamic='force-dynamic';
const tileSchema=z.object({
  tileX:z.coerce.number().int().min(0).max(STAR_TILE_COUNT-1),
  tileY:z.coerce.number().int().min(0).max(STAR_TILE_COUNT-1),
});

export async function GET(req:NextRequest) {
  const params=req.nextUrl.searchParams;
  try {
    if(params.has('tileX')||params.has('tileY')){
      const tile=tileSchema.safeParse(Object.fromEntries(params));
      if(!tile.success)return NextResponse.json({error:'Choose a valid star-map region.'},{status:400});
      const stars=await prisma.completion.findMany({
        where:{status:'ACCEPTED',OR:starTileRanges(tile.data.tileX,tile.data.tileY)},
        select:{starNumber:true,starName:true},orderBy:{starNumber:'asc'},take:2500,
      });
      return NextResponse.json({stars},{headers:{'Cache-Control':'public, max-age=15'}});
    }
    const [tiles,recent]=await Promise.all([
      prisma.$queryRaw<StarTile[]>`
        SELECT (("starNumber"-1)%1000/50)::INTEGER AS "tileX",
               (("starNumber"-1)/1000/50)::INTEGER AS "tileY",
               COUNT(*)::INTEGER AS count
        FROM "Completion" WHERE "status"='ACCEPTED'
        GROUP BY 1,2
      `,
      prisma.completion.findMany({where:{status:'ACCEPTED'},select:{starNumber:true,starName:true},orderBy:{starNumber:'desc'},take:500}),
    ]);
    return NextResponse.json({capacity:STAR_CAPACITY,count:tiles.reduce((sum,tile)=>sum+tile.count,0),tiles,recent},{headers:{'Cache-Control':'public, max-age=15'}});
  } catch(error) {
    console.error('Star map data unavailable.',error instanceof Error?error.name:'UnknownError');
    return NextResponse.json({error:'The star map could not connect. Please try again.'},{status:503});
  }
}
