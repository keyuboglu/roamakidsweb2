import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  icons: {icon:{url:'/roama-icon.png',type:'image/png',sizes:'32x32'},apple:{url:'/roama-apple-icon.png',sizes:'180x180',type:'image/png'}},
  title: 'The Great Signal Quest — ROAMA Kids',
  description: 'A million stars. One global quest. Discover something new in the world around you.',
  openGraph: { title: 'A Million Stars. One Global Quest.', description: 'Complete a challenge. Add your star. Help build something bigger than a game.', type: 'website' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
