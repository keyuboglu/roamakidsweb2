import type {Metadata} from 'next';
import StarMap from '@/components/StarMap';
import {getCanonicalOrigin} from '@/lib/site-url';
import {serializeJsonLd} from '@/lib/json-ld';
import {serverLanguage,languageAlternates} from '@/lib/server-language';

const englishMetadata:Metadata={
  title:'ROAMA Kids · Signal Quest Star Map | Find a Public Star',
  description:'Explore the ROAMA Kids · Signal Quest star map and look up a star by its public number. Public star cards show only approved star details.',
  alternates:{canonical:'/stars'},
  openGraph:{
    title:'ROAMA Kids · Signal Quest Star Map | Find a Public Star',
    description:'Explore the campaign star map and look up a public star by its number.',
    type:'website',
    url:'/stars',
    images:[{url:'/og-great-signal.png',width:1200,height:630,alt:'ROAMA Kids · Signal Quest campaign star map.'}],
  },
  twitter:{
    card:'summary',
    title:'ROAMA Kids · Signal Quest Star Map | Find a Public Star',
    description:'Look up public star cards by number in the ROAMA Kids · Signal Quest.',
    images:['/og-great-signal.png'],
  },
};

export async function generateMetadata():Promise<Metadata> {
  const language=await serverLanguage();
  const title=language==='tr'?'ROAMA Kids · Sinyal Görevi Yıldız Haritası | Yıldızınızı Bulun':String(englishMetadata.title);
  const description=language==='tr'?'ROAMA Kids · Sinyal Görevi yıldız haritasını keşfedin. Herkese açık yıldızları numarasıyla bulun.':String(englishMetadata.description);
  const image=language==='tr'?'/og-great-signal-tr.png':'/og-great-signal.png';
  return {...englishMetadata,title,description,alternates:languageAlternates('/stars',language),
    openGraph:{title,description,url:languageAlternates('/stars',language).canonical,locale:language==='tr'?'tr_TR':'en_US',images:[image]},
    twitter:{card:'summary',title,description,images:[image]}};
}

export default async function StarsPage() {
  const language=await serverLanguage();
  const origin=getCanonicalOrigin();
  const structuredData={
    '@context':'https://schema.org',
    '@type':'WebPage',
    '@id':`${origin}/stars#webpage`,
    url:languageAlternates('/stars',language).canonical,
    name:language==='tr'?'ROAMA Kids · Sinyal Görevi Yıldız Haritası | Yıldızınızı Bulun':'ROAMA Kids · Signal Quest Star Map | Find a Public Star',
    description:language==='tr'?'Kampanya yıldız haritasını keşfedin ve bir yıldızı numarasıyla bulun.':'Explore the campaign star map and look up a public star by its number.',
    inLanguage:language,
    isPartOf:{'@id':`${origin}/#website`},
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd(structuredData)}}/><StarMap/></>;
}
