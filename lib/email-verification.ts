import {createHmac} from 'node:crypto';

export const EMAIL_VERIFICATION_TTL_MS=20*60*1000;

export function adultEmailDigest(email:string) {
  const secret=process.env.ADULT_EMAIL_HASH_SECRET;
  if(!secret||secret.length<32)throw new Error('ADULT_EMAIL_HASH_SECRET must contain at least 32 characters.');
  return createHmac('sha256',secret).update(`roama-adult-email:v1:${email}`).digest('hex');
}

export function emailVerificationConfigured() {
  const baseUrl=process.env.NEXT_PUBLIC_SITE_URL;
  const digestSecret=process.env.ADULT_EMAIL_HASH_SECRET;
  if(!process.env.RESEND_API_KEY||!process.env.RESEND_FROM_EMAIL||process.env.RESEND_SENDER_DOMAIN_VERIFIED!=='true'||!baseUrl||!digestSecret||digestSecret.length<32)return false;
  try {
    const url=new URL(baseUrl);
    if(process.env.NODE_ENV==='production'&&url.protocol!=='https:')return false;
    return url.protocol==='https:'||url.protocol==='http:';
  } catch {
    return false;
  }
}

export async function sendVerificationEmail(email:string,token:string) {
  const apiKey=process.env.RESEND_API_KEY;
  const from=process.env.RESEND_FROM_EMAIL;
  const baseUrl=process.env.NEXT_PUBLIC_SITE_URL;
  if(!apiKey||!from||!baseUrl)throw new Error('Resend email verification is not configured.');
  const url=new URL(baseUrl);
  if(process.env.NODE_ENV==='production'&&url.protocol!=='https:')throw new Error('NEXT_PUBLIC_SITE_URL must use HTTPS in production.');
  const verificationUrl=`${url.origin}/verify-email#${token}`;
  const response=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
    body:JSON.stringify({
      from,
      to:[email],
      subject:'Verify your ROAMA Signal Quest star',
      text:`Verify your adult email to continue or recover your ROAMA Signal Quest star. This link expires in 20 minutes and can only be used once:\n\n${verificationUrl}\n\nIf you did not request this email, you can ignore it.`,
      html:`<p>Verify your adult email to continue or recover your ROAMA Signal Quest star.</p><p><a href="${verificationUrl}">Verify my email</a></p><p>This link expires in 20 minutes and can only be used once. If you did not request this email, you can ignore it.</p>`,
    }),
    signal:AbortSignal.timeout(8000),
  });
  return response.ok;
}
