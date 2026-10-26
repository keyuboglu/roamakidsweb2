export const PRODUCTION_SITE_URL='https://signalquest.roama.tech';

export function getCanonicalOrigin(
  configuredUrl=process.env.NEXT_PUBLIC_SITE_URL,
  nodeEnv=process.env.NODE_ENV,
) {
  const fallback=nodeEnv==='development'?'http://localhost:3000':PRODUCTION_SITE_URL;
  if(!configuredUrl)return fallback;
  try {
    const url=new URL(configuredUrl);
    const localHost=['localhost','127.0.0.1','::1'].includes(url.hostname);
    const invalidShape=url.username||url.password||url.pathname!=='/'||url.search||url.hash;
    if(invalidShape)return fallback;
    if(nodeEnv==='development'&&localHost&&(url.protocol==='http:'||url.protocol==='https:'))return url.origin;
    if(url.protocol!=='https:'||localHost||url.hostname.endsWith('.workers.dev'))return fallback;
    return url.origin;
  } catch {
    return fallback;
  }
}
