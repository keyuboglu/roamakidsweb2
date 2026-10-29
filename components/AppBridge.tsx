'use client';

import AppDownloadCTA from '@/components/AppDownloadCTA';
import {useLanguage} from '@/components/FunnelPreferences';
import type {Attribution} from '@/lib/attribution';

export default function AppBridge({slug,attribution}:{slug?:string;attribution?:Attribution}) {
  const tr=useLanguage()==='tr';
  return <section className="app-bridge" aria-labelledby="app-bridge-heading">
    <p className="eyebrow">{tr?'SONRAKİ MACERA':'YOUR NEXT ADVENTURE'}</p>
    <h2 id="app-bridge-heading">{tr?'Sinyal Alındı! Keşfinizi ROAMA dünyasına taşımaya hazır mısınız?':'Signal Received! Ready to see how this changes your ROAMA world?'}</h2>
    <p>{tr?'Gerçek dünyadaki keşfiniz maceranın bir sonraki bölümünü açtı. Keşfinizi ROAMA Kids uygulamasına taşıyın, Kaşifinizi oluşturun ve dünyanın dönüşümünü görün!':'Your real-world discovery just unlocked the next part of the adventure. Bring your discovery into the ROAMA Kids app, create your Explorer, and see the world transform!'}</p>
    <AppDownloadCTA slug={slug} attribution={attribution}/>
    <p className="app-trust">{tr?'%100 Çocuk Dostu • Reklamsız • Herkese Açık Sohbet Yok • 6–12 yaş':'100% Kid-Safe • No Ads • No Public Chat • Ages 6–12'}</p>
    <p className="app-bridge-note">{tr?'Uygulama isteğe bağlıdır. Web yıldızınız otomatik aktarılmaz; bu davet uygulama içinde otomatik bir ödül açmaz.':'The app is optional. Your web star is not transferred automatically; this invitation does not automatically unlock an in-app reward.'}</p>
  </section>;
}
