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
    <p className="eyebrow">PRIVACY INFORMATION</p>
    <h1>Participation without a child account.</h1>
    <p className="detail-lede">An adult organizes participation and uses their own email address. No child account is created. For privacy questions or requests, contact <Link href="mailto:info@roama.tech">info@roama.tech</Link>.</p>
    <section><h2>Star claims and the counter</h2><p>After completing one challenge, a parent, guardian, or adult organizer can verify their own email and claim one permanent star. Each verified adult email can claim at most one star. The counter counts unique verified adult-email claims, not children, visits, unverified forms, or challenge attempts. The email is used for this transactional verification only and is not marketing consent.</p></section>
    <section><h2>What campaign records contain</h2><p>A verified completion contains a challenge reference, registration and verification timestamps, an idempotency key, a permanent star number, an optional public pseudonym, a keyed digest of the adult email, and a keyed hash of a network address used to limit repeated submissions. The raw email address is not stored in the campaign database. Resend processes the email address to deliver the verification message. Pending verification records store only a random token hash, keyed email digest, challenge reference, optional pseudonym, and expiry. Tokens expire after 20 minutes and are deleted 24 hours after expiry. No child account, child email, photo, school, birth date, or location is requested.</p></section>
    <section><h2>Public star names</h2><p>Giving a star a name is optional. The adult must explicitly confirm that the name is fictional, contains no personal information, and may be displayed publicly. Confirmed names appear immediately on the public star map; they are not reviewed before publication. Anyone can view or share a star by its number. Do not use a child&apos;s real name or any contact or identifying information.</p><p>The name stays associated with the star until an administrator removes it or the campaign data is deleted. Removing a name does not remove the completion or change the global total. Adults may contact <Link href="mailto:info@roama.tech">info@roama.tech</Link> to request removal of a public name. Basic input checks do not guarantee that a submitted name is safe or appropriate.</p></section>
    <section><h2>Retention, recovery and deletion</h2><p>The permanent star number, challenge reference, optional public pseudonym, and keyed adult-email digest are retained for the life of the permanent star so the campaign can enforce one star per adult email and recover an existing star. This keyed digest is pseudonymous data, not an anonymous record, and is not reversible by the campaign into the original email address. Verification tokens are removed 24 hours after expiry; rate-limit records are removed after 24 hours; abuse-prevention network hashes are removed 30 days after registration. Database backups follow the database provider&apos;s backup and retention controls.</p><p>An adult can contact <Link href="mailto:info@roama.tech">info@roama.tech</Link> to request removal of a public name or discuss an access/deletion request. Removing a name does not remove or renumber the permanent star. Because the keyed email digest is retained to prevent duplicate claims and support recovery, a deletion request may affect these functions; requests are reviewed individually.</p></section>
    <section><h2>Abuse prevention</h2><p>A keyed network hash is used for request throttling and review of unusual bursts. Email requests, token redemption, and public star lookup have database-backed rate limits shared across application instances. Cloudflare schedules daily deletion of completion abuse hashes older than 30 days, rate-limit records older than 24 hours, and expired verification tokens after 24 hours. Operators monitor scheduled maintenance and secure database backups.</p></section>
    <section><h2>Campaign analytics</h2><p>First-party aggregate event records may include page or challenge views, voluntary star-card download/shares, App Store clicks, and optional UTM source labels. The system does not intentionally add adult email addresses or child-identifying information to these records. Sharing is optional and adult-controlled; no social-media post is required to receive a star.</p></section>
    <section><h2>Adult responsibility and safety</h2><p>An adult must supervise the activity, use the safety guidance, and submit their own email—not a child&apos;s. Adult confirmation records a report that the challenge was completed safely; it is not independent verification and does not constitute a universal legal parental-consent mechanism. Public pseudonyms are displayed immediately and are not pre-moderated. Do not include real names or other personal information.</p><p>This information describes the campaign&apos;s current data practices and is not legal advice. Requirements differ by country; the campaign operator should review applicable rules for each market where participation is promoted.</p></section>
    <p><Link className="text-link" href="/stars">Explore the sky →</Link></p>
  </main></>;
}
