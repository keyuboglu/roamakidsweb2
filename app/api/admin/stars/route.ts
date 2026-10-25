import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {requireAdmin} from '@/lib/admin-auth';
import {isSameOrigin} from '@/lib/session';
import {prisma} from '@/lib/prisma';
import {STAR_CAPACITY} from '@/lib/stars';

export async function GET(req:NextRequest) {
  if(!await requireAdmin(req))return NextResponse.json({error:'Not authorized.'},{status:401});
  const parsed=z.coerce.number().int().min(1).max(STAR_CAPACITY+1).safeParse(req.nextUrl.searchParams.get('before')??STAR_CAPACITY+1);
  if(!parsed.success)return NextResponse.json({error:'Choose a valid star page.'},{status:400});
  try {
    const stars=await prisma.completion.findMany({
      where:{starName:{not:null},starNumber:{lt:parsed.data}},
      select:{starNumber:true,starName:true,challenge:{select:{title:true}}},
      orderBy:{starNumber:'desc'},take:51,
    });
    return NextResponse.json({stars:stars.slice(0,50),nextBefore:stars.length>50?stars[49].starNumber:null},{headers:{'Cache-Control':'no-store'}});
  } catch(error) {
    console.error('Admin star listing failed.',error instanceof Error?error.name:'UnknownError');
    return NextResponse.json({error:'Star names could not load.'},{status:503});
  }
}

export async function DELETE(req:NextRequest) {
  if(!isSameOrigin(req)||!await requireAdmin(req))return NextResponse.json({error:'Not authorized.'},{status:403});
  const parsed=z.object({starNumber:z.number().int().min(1).max(STAR_CAPACITY)}).safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:'Choose a valid star.'},{status:400});
  try {
    const changed=await prisma.completion.updateMany({where:{starNumber:parsed.data.starNumber},data:{starName:null}});
    if(!changed.count)return NextResponse.json({error:'This star could not be found.'},{status:404});
    return NextResponse.json({ok:true});
  } catch(error) {
    console.error('Admin star-name removal failed.',error instanceof Error?error.name:'UnknownError');
    return NextResponse.json({error:'The star name could not be removed.'},{status:503});
  }
}
