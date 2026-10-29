import type {Metadata} from 'next';
import Link from 'next/link';
import {serverLanguage} from '@/lib/server-language';
import {localizedPath} from '@/lib/funnel';

const englishMetadata:Metadata={
  title:'Page not found | ROAMA Signal Quest',
  description:'This ROAMA Signal Quest page could not be found. Return to the campaign and choose one of the three family challenges.',
  robots:{index:false,follow:true},
};

export async function generateMetadata():Promise<Metadata> {
  if(await serverLanguage()==='en')return englishMetadata;
  return {title:'Sayfa bulunamadı | ROAMA Sinyal Macerası',description:'Bu sayfa bulunamadı. Kampanyaya dönerek üç aile görevinden birini seçin.',robots:{index:false,follow:true}};
}

export default async function NotFound() {
  const language=await serverLanguage();
  const tr=language==='tr';
  return <main className="detail-page">
    <p className="eyebrow">404 · {tr?'SAYFA BULUNAMADI':'PAGE NOT FOUND'}</p>
    <h1>{tr?'Bu yol rotadan çıktı.':'This path has gone off course.'}</h1>
    <p className="detail-lede">{tr?'Sayfa taşınmış veya görev bağlantısı yanlış olabilir.':'The page may have moved, or the challenge link may be incorrect.'}</p>
    <p><Link className="text-link" href={localizedPath('/',language)}>{tr?'ROAMA Sinyal Macerası’na dön':'Return to ROAMA Signal Quest'} →</Link></p>
    <p><Link className="text-link" href={localizedPath('/#challenges',language)}>{tr?'Üç görevi keşfet':'Browse the three challenges'} →</Link></p>
  </main>;
}
