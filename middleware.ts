import {NextRequest,NextResponse} from 'next/server';
import {detectLanguage} from '@/lib/funnel';

export function middleware(request:NextRequest) {
  const headers=new Headers(request.headers);
  headers.set('x-roama-language',detectLanguage(request.nextUrl.search,request.headers.get('accept-language')?.split(',')[0]||'en'));
  return NextResponse.next({request:{headers}});
}

export const config={matcher:['/((?!api|admin|_next|images|.*\\.).*)']};
