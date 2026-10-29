import type { Metadata } from 'next';
import './globals.css';
import {getCanonicalOrigin} from '@/lib/site-url';
import {FAMILY_CHALLENGE_MESSAGE} from '@/lib/funnel';
import FunnelPreferences from '@/components/FunnelPreferences';

export const metadata: Metadata = {
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body><FunnelPreferences/>{children}</body></html>;
}
