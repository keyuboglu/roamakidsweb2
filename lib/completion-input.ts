import {z} from 'zod';
import {STAR_NAME_MAX_LENGTH} from '@/lib/stars';

export const starNameSchema=z.string().trim().max(STAR_NAME_MAX_LENGTH)
  .regex(/^(?:[\p{L}\p{N}][\p{L}\p{N} '\u2019-]*)?$/u,'Use a made-up name with letters, spaces, or hyphens.')
  .refine(value=>!/\p{N}{4}/u.test(value),'Do not include phone numbers, dates, or other personal information.');

export const completionSchema=z.object({
  challengeSlug:z.string().min(1).max(100),
  idempotencyKey:z.string().uuid(),
  adultConfirmed:z.literal(true),
  website:z.string().max(0).optional(),
  starName:starNameSchema.optional(),
  publicNameConfirmed:z.boolean().optional(),
}).refine(value=>!value.starName||value.publicNameConfirmed===true,{
  message:'Confirm that the made-up star name will be public.',
  path:['publicNameConfirmed'],
});
