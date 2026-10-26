import type {Metadata} from 'next';
import StarMap from '@/components/StarMap';
import {getCanonicalOrigin} from '@/lib/site-url';
import {serializeJsonLd} from '@/lib/json-ld';

export const metadata:Metadata={
  title:'ROAMA Signal Quest Star Map | Find a Public Star',
  description:'Explore the ROAMA Signal Quest star map and look up a star by its public number. Public star cards show only approved star details.',
  alternates:{canonical:'/stars'},
  openGraph:{
    title:'ROAMA Signal Quest Star Map | Find a Public Star',
    description:'Explore the campaign star map and look up a public star by its number.',
    type:'website',
    url:'/stars',
    images:[{url:'/og-great-signal.png',width:1200,height:630,alt:'ROAMA Signal Quest campaign star map.'}],
  },
  twitter:{
    card:'summary',
    title:'ROAMA Signal Quest Star Map | Find a Public Star',
    description:'Look up public star cards by number in the ROAMA Signal Quest.',
    images:['/og-great-signal.png'],
  },
};

export default function StarsPage() {
  const origin=getCanonicalOrigin();
  const structuredData={
    '@context':'https://schema.org',
    '@type':'WebPage',
    '@id':`${origin}/stars#webpage`,
    url:`${origin}/stars`,
    name:'ROAMA Signal Quest Star Map | Find a Public Star',
    description:'Explore the campaign star map and look up a public star by its number.',
    inLanguage:'en',
    isPartOf:{'@id':`${origin}/#website`},
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd(structuredData)}}/><StarMap/></>;
}
