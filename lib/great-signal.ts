export const GREAT_SIGNAL_START=new Date('2026-12-20T00:00:00+03:00');
export const GREAT_SIGNAL_END=new Date('2026-12-23T00:00:00+03:00');
export const GREAT_SIGNAL_LAYER='The Great Signal 2026';

export function isGreatSignalDate(date:Date) {
  return date>=GREAT_SIGNAL_START&&date<GREAT_SIGNAL_END;
}

export function isGreatSignalStar(slug:string,verifiedAt:Date|null) {
  return slug==='shadow-signal'&&verifiedAt!==null&&isGreatSignalDate(verifiedAt);
}
