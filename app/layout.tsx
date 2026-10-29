import type { Metadata } from 'next';
import './globals.css';
import {getCanonicalOrigin} from '@/lib/site-url';
import {FAMILY_CHALLENGE_MESSAGE} from '@/lib/funnel';
import FunnelPreferences,{LanguageProvider} from '@/components/FunnelPreferences';
import LanguageSwitch from '@/components/LanguageSwitch';
import {serverLanguage} from '@/lib/server-language';

const englishMetadata: Metadata = {
  metadataBase: new URL(getCanonicalOrigin()),
  icons: {icon:{url:'/roama-icon.png',type:'image/png',sizes:'32x32'},apple:{url:'/roama-apple-icon.png',sizes:'180x180',type:'image/png'}},
  title: 'ROAMA Signal Quest | Creative Challenges for Kids & Families',
  description: FAMILY_CHALLENGE_MESSAGE,
  openGraph: {
    title: 'ROAMA Signal Quest | Creative Challenges for Kids & Families',
    description: FAMILY_CHALLENGE_MESSAGE,
    type: 'website',
    siteName: 'ROAMA Signal Quest',
    images: [{url:'/og-great-signal.png',width:1200,height:630,alt:'ROAMA Signal Quest — A million stars and three creative family challenges.'}],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ROAMA Signal Quest | Creative Challenges for Kids & Families',
    description: FAMILY_CHALLENGE_MESSAGE,
    images: ['/og-great-signal.png'],
  },
};

export async function generateMetadata():Promise<Metadata> {
  const tr=await serverLanguage()==='tr';
  if(!tr)return englishMetadata;
  const title='ROAMA Sinyal Macerası | Çocuklar ve Aileler İçin Yaratıcı Görevler';
  const description='6–12 yaş çocuklar için üç ücretsiz, ekransız aile görevi. Uygulama, fotoğraf veya kayıt gerekmez.';
  return {...englishMetadata,title,description,
    openGraph:{title,description,type:'website',siteName:'ROAMA Sinyal Macerası',locale:'tr_TR',images:[{url:'/og-great-signal.png',width:1200,height:630,alt:'ROAMA Sinyal Macerası — bir milyon yıldız ve üç yaratıcı aile görevi.'}]},
    twitter:{card:'summary_large_image',title,description,images:['/og-great-signal.png']}};
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const language=await serverLanguage();
  return <html lang={language} data-scroll-behavior="smooth"><body><LanguageProvider language={language}><FunnelPreferences/><LanguageSwitch/>{children}</LanguageProvider></body></html>;
}
