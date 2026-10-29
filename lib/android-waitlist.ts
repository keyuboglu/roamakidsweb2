import {createCipheriv,createDecipheriv,createHmac,hkdfSync,randomBytes} from 'node:crypto';

export const WAITLIST_RETENTION_MS=90*86400000;
const context='roama-android-waitlist:v1';

function secret() {
  const value=process.env.ADULT_EMAIL_HASH_SECRET;
  if(!value||value.length<32)throw new Error('Android waitlist email protection is not configured.');
  return value;
}

function encryptionKey() {
  return Buffer.from(hkdfSync('sha256',secret(),'',`${context}:encryption`,32));
}

export function waitlistEmailHash(email:string) {
  return createHmac('sha256',secret()).update(`${context}:${email}`).digest('hex');
}

export function encryptWaitlistEmail(email:string) {
  const iv=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',encryptionKey(),iv);
  cipher.setAAD(Buffer.from(context));
  const encrypted=Buffer.concat([cipher.update(email,'utf8'),cipher.final()]);
  return ['v1',iv.toString('base64'),cipher.getAuthTag().toString('base64'),encrypted.toString('base64')].join('.');
}

export function decryptWaitlistEmail(value:string) {
  const [version,iv,tag,encrypted,...extra]=value.split('.');
  if(version!=='v1'||!iv||!tag||!encrypted||extra.length)throw new Error('Invalid waitlist email envelope.');
  const decipher=createDecipheriv('aes-256-gcm',encryptionKey(),Buffer.from(iv,'base64'));
  decipher.setAAD(Buffer.from(context));
  decipher.setAuthTag(Buffer.from(tag,'base64'));
  return Buffer.concat([decipher.update(Buffer.from(encrypted,'base64')),decipher.final()]).toString('utf8');
}
