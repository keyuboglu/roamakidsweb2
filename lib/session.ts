import {createHmac,timingSafeEqual} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
const COOKIE='roama_admin';
function secret(){const s=process.env.SESSION_SECRET;if(!s||s.length<32)throw new Error('SESSION_SECRET must contain at least 32 characters.');return s;}
function sign(value:string){return createHmac('sha256',secret()).update(value).digest('base64url');}
export function issueSession(id:string,email:string){const payload=Buffer.from(JSON.stringify({id,email,exp:Date.now()+8*60*60*1000})).toString('base64url');return `${payload}.${sign(payload)}`;}
export function readSession(req:NextRequest){try{const token=req.cookies.get(COOKIE)?.value;if(!token)return null;const [payload,mac]=token.split('.');if(!payload||!mac)return null;const expected=Buffer.from(sign(payload)),actual=Buffer.from(mac);if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return null;const value=JSON.parse(Buffer.from(payload,'base64url').toString()) as {id:string;email:string;exp:number};return value.exp>Date.now()?value:null;}catch{return null;}}
export function setSession(res:NextResponse,token:string){res.cookies.set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:8*60*60});}
export function clearSession(res:NextResponse){res.cookies.set(COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:0});}
export function isSameOrigin(req:NextRequest){const origin=req.headers.get('origin');const expected=process.env.NEXT_PUBLIC_SITE_URL;if(!origin||!expected)return false;try{const requestOrigin=new URL(req.url).origin;const requestOriginHeader=new URL(origin).origin;return requestOriginHeader===new URL(expected).origin||requestOriginHeader===requestOrigin;}catch{return false;}}
