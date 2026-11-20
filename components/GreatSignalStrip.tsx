'use client';

import {useLanguage} from '@/components/FunnelPreferences';

/** A small line in the top bar: Signal Quest is part of the Great Signal on roama.tech. */
export default function GreatSignalStrip() {
  const tr=useLanguage()==='tr';
  const href=tr?'https://roama.tech/tr/great-signal?utm_source=signalquest':'https://roama.tech/great-signal?utm_source=signalquest';
  return <a className="signal-strip" href={href}>
    <span>{tr?'20–22 Aralık':'Dec 20–22'}</span>
    <span className="signal-strip-long"> · {tr?'Büyük İşaret’in bir parçası':'part of the Great Signal'} · <u>roama.tech/great-signal</u></span>
    <span className="signal-strip-short"> · {tr?'Büyük İşaret':'Great Signal'}</span>
    <span aria-hidden="true"> ↗</span>
  </a>;
}
