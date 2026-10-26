import Link from 'next/link';
import type {Metadata} from 'next';
import {getCanonicalOrigin} from '@/lib/site-url';
import {serializeJsonLd} from '@/lib/json-ld';

export const metadata:Metadata={
  title:'Privacy Information | ROAMA Signal Quest',
  description:'Learn how ROAMA Signal Quest handles adult email verification, public star names, privacy requests, retention, safety and campaign analytics.',
  alternates:{canonical:'/privacy'},
  openGraph:{
    title:'Privacy Information | ROAMA Signal Quest',
    description:'How the campaign handles adult email verification, public star names, privacy requests, retention and analytics.',
    type:'article',
    url:'/privacy',
    images:[{url:'/og-great-signal.png',width:1200,height:630,alt:'ROAMA Signal Quest privacy information.'}],
  },
  twitter:{
    card:'summary',
    title:'Privacy Information | ROAMA Signal Quest',
    description:'Read the campaign privacy information, data practices and current participation status.',
    images:['/og-great-signal.png'],
  },
};

export default function Privacy() {
  const origin=getCanonicalOrigin();
  const canonical=`${origin}/privacy`;
  const structuredData={
    '@context':'https://schema.org',
    '@type':'WebPage',
    '@id':`${canonical}#webpage`,
    url:canonical,
    name:'Privacy Information | ROAMA Signal Quest',
    description:'Learn how ROAMA Signal Quest handles adult email verification, public star names, privacy requests, retention, safety and campaign analytics.',
    inLanguage:'en',
    isPartOf:{'@id':`${origin}/#website`},
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd(structuredData)}}/><main className="detail-page privacy-page">
    <Link href="/" className="detail-back">← The Great Signal Quest</Link>
    <p className="eyebrow">PRIVACY INFORMATION · DRAFT FOR REVIEW</p>
    <h1>Participation without a child account.</h1>
    <p className="detail-lede">This page describes the current implementation and openly lists what is not ready. The campaign owner must add legal identity, contact details, retention commitments, and launch-market disclosures after legal review before promoting participation.</p>
    <section><h2>Current participation status</h2><p>Star claims are currently disabled by the campaign configuration. No email is collected, no verification email is sent and no star is created through the claim flow. The public counter includes only claims with a verified adult email; no unverified submission or page view is counted as a star.</p><p>If claims are enabled in the future, an adult will submit their own email to receive a one-time verification link. The email is intended for this transactional purpose only and is not marketing consent.</p></section>
    <section><h2>What campaign records contain</h2><p>A verified completion contains a challenge reference, registration and verification timestamps, an idempotency key, a permanent star number, an optional made-up star name, a keyed digest of the adult email, and a keyed hash of a network address used to limit repeated submissions. The raw email address is not stored in the campaign database. Pending verification records store only a random token hash, keyed email digest, challenge reference, optional pseudonym, and expiry. Tokens expire after 20 minutes and are deleted after they have been expired for 24 hours. No child account is provided.</p></section>
    <section><h2>Public star names</h2><p>Giving a star a name is optional. The adult must explicitly confirm that the name is fictional, contains no personal information, and may be displayed publicly. Confirmed names appear immediately on the public star map; they are not reviewed before publication. Anyone can view or share a star by its number. Do not use a child&apos;s real name or any contact or identifying information.</p><p>The name stays associated with the star until an administrator removes it or the campaign data is deleted. Removing a name does not remove the completion or change the global total. Adults may contact <Link href="mailto:info@roama.tech">info@roama.tech</Link> to request removal of a public name. Basic input checks do not guarantee that a submitted name is safe or appropriate.</p></section>
    <section><h2>Abuse prevention</h2><p>A keyed network hash is used for request throttling and review of unusual bursts. Email requests, token redemption, and public star lookup have database-backed rate limits shared across application instances. Cloudflare deployments schedule daily deletion of completion abuse hashes older than 30 days, rate-limit records older than 24 hours, and expired verification tokens. Operators must verify successful runs and secure database backups. Other hosting environments require their own documented maintenance schedule.</p></section>
    <section><h2>Adult email, recovery and deletion</h2><p>Email ownership is confirmed through a random, single-use link that expires after 20 minutes. The database keeps a keyed digest rather than the raw address so the same adult can recover their existing star without creating another. A repeated request returns a generic response and does not disclose whether an address owns a star. An adult can contact <Link href="mailto:info@roama.tech">info@roama.tech</Link> to request deletion or removal of a public name. The retention schedule for star records, email digests, and backups has not yet been decided; do not publish a challenge until it is defined and reviewed for the launch markets. Verification emails are not marketing consent.</p></section>
    <section><h2>Campaign analytics</h2><p>First-party aggregate event records may include page or challenge views, voluntary star-card download/shares, App Store clicks, and optional UTM source labels. The system does not intentionally add adult email addresses or child-identifying information to these records. Review appropriate analytics disclosure or consent for each launch market.</p></section>
    <section><h2>Adult confirmation and safety</h2><p>An adult confirmation records a report that the challenge was completed safely. It is not independent verification and does not constitute a universal legal parental-consent mechanism.</p></section>
    <section><h2>Before launch</h2><p>The owner must identify the data controller, approve the single real challenge and its safety guidance, define the retention schedule for star records and backups, review public pseudonyms and analytics practices, verify retention jobs, and obtain jurisdiction-specific advice for each launch market. Privacy and deletion requests can be sent to <Link href="mailto:info@roama.tech">info@roama.tech</Link>. This draft is not legal advice or a compliance statement.</p></section>
    <p><Link className="text-link" href="/stars">Explore the sky →</Link></p>
  </main></>;
}
