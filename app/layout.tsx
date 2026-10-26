import type { Metadata } from 'next';
import './globals.css';
import {getCanonicalOrigin} from '@/lib/site-url';

export const metadata: Metadata = {
  metadataBase: new URL(getCanonicalOrigin()),
  icons: {icon:{url:'/roama-icon.png',type:'image/png',sizes:'32x32'},apple:{url:'/roama-apple-icon.png',sizes:'180x180',type:'image/png'}},
  title: 'ROAMA Signal Quest | Creative Challenges for Kids & Families',
  description: 'Try three free, screen-free family challenges for kids ages 6–12: play with shadows, explore tiny details and test simple balance ideas at home. No app needed.',
  openGraph: {
    title: 'ROAMA Signal Quest | Creative Challenges for Kids & Families',
    description: 'Try three free, screen-free family challenges for kids ages 6–12: play with shadows, explore tiny details and test simple balance ideas at home. No app needed.',
    type: 'website',
    siteName: 'ROAMA Signal Quest',
    images: [{url:'/og-great-signal.png',width:1200,height:630,alt:'ROAMA Signal Quest — A million stars and three creative family challenges.'}],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ROAMA Signal Quest | Creative Challenges for Kids & Families',
    description: 'Three creative, screen-free family challenges for kids ages 6–12. No app needed.',
    images: ['/og-great-signal.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
