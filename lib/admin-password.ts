import {prisma} from '@/lib/prisma';

export async function verifyAdminPassword(password:string,passwordHash:string) {
  // Keep bcrypt's expensive work outside the Workers Free CPU budget.
  // pgcrypto expects the equivalent $2a$ prefix, while bcryptjs writes $2b$.
  const compatibleHash=passwordHash.replace(/^\$2[by]\$/,'$2a$');
  const [result]=await prisma.$queryRaw<Array<{valid:boolean}>>`
    SELECT crypt(${password}, ${compatibleHash}) = ${compatibleHash} AS valid
  `;
  if(!result)throw new Error('Password verification returned no result.');
  return result.valid;
}
