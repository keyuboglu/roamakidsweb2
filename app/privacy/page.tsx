import Link from 'next/link';
import type {Metadata} from 'next';
import {getCanonicalOrigin} from '@/lib/site-url';
import {serializeJsonLd} from '@/lib/json-ld';
import TurkishPrivacy from '@/components/TurkishPrivacy';
import {serverLanguage,languageAlternates} from '@/lib/server-language';

const englishMetadata:Metadata={
  title:'ROAMA Kids · Signal Quest | Privacy Information',
  description:'Learn how ROAMA Kids · Signal Quest handles adult email verification, public star names, privacy requests, retention, safety and campaign analytics.',
  alternates:{canonical:'/privacy'},
  openGraph:{
    title:'ROAMA Kids · Signal Quest | Privacy Information',
    description:'How the campaign handles adult email verification, public star names, privacy requests, retention and analytics.',
    type:'article',
    url:'/privacy',
    images:[{url:'/og-great-signal.png',width:1200,height:630,alt:'ROAMA Kids · Signal Quest privacy information.'}],
  },
  twitter:{
    card:'summary',
    title:'ROAMA Kids · Signal Quest | Privacy Information',
    description:'Read the campaign privacy information, data practices and current participation status.',
    images:['/og-great-signal.png'],
  },
};

export async function generateMetadata():Promise<Metadata> {
  const language=await serverLanguage();
  const title=language==='tr'?'ROAMA Kids · Sinyal Görevi | Gizlilik Bilgileri':String(englishMetadata.title);
  const description=language==='tr'?'Yetişkin e-posta doğrulaması, yıldız adları, Büyük İşaret katmanı, saklama ve kampanya analitiği hakkında bilgi alın.':String(englishMetadata.description);
  const image=language==='tr'?'/og-great-signal-tr.png':'/og-great-signal.png';
  return {...englishMetadata,title,description,alternates:languageAlternates('/privacy',language),
    openGraph:{title,description,url:languageAlternates('/privacy',language).canonical,locale:language==='tr'?'tr_TR':'en_US',images:[image]},
    twitter:{card:'summary',title,description,images:[image]}};
}

export default async function Privacy() {
  const language=await serverLanguage();
  const origin=getCanonicalOrigin();
  const canonical=`${origin}/privacy`;
  const structuredData={
    '@context':'https://schema.org',
    '@type':'WebPage',
    '@id':`${canonical}#webpage`,
    url:languageAlternates('/privacy',language).canonical,
    name:language==='tr'?'ROAMA Kids · Sinyal Görevi | Gizlilik Bilgileri':'ROAMA Kids · Signal Quest | Privacy Information',
    description:language==='tr'?'Kampanyanın gizlilik ve veri uygulamaları.':'Learn how ROAMA Kids · Signal Quest handles adult email verification, public star names, privacy requests, retention, safety and campaign analytics.',
    inLanguage:language,
    isPartOf:{'@id':`${origin}/#website`},
  };
  if(language==='tr')return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd(structuredData)}}/><TurkishPrivacy/></>;
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd(structuredData)}}/><main className="detail-page privacy-page">
    <Link href="/?lang=en" className="detail-back">← ROAMA Kids · Signal Quest</Link>
    <p className="eyebrow">PRIVACY INFORMATION</p>
    <h1>Participation without a child account.</h1>
    <p className="detail-lede">An adult organizes participation and uses their own email address. No child account is created. For privacy questions or requests, contact <Link href="mailto:info@roama.tech">info@roama.tech</Link>.</p>
    <section><h2>Star claims and the counter</h2><p>After completing one challenge, a parent, guardian, or adult organizer can verify their own email and claim one permanent star. Each verified adult email can claim at most one star. The counter counts unique verified adult-email claims, not children, visits, unverified forms, or challenge attempts. The email is used for this transactional verification only and is not marketing consent.</p></section>
    <section><h2>What campaign records contain</h2><p>A verified completion contains a challenge reference, registration and verification timestamps, an idempotency key, a permanent star number, an optional public pseudonym, a keyed digest of the adult email, and a keyed hash of a network address used to limit repeated submissions. Raw star-verification email addresses are not stored in the campaign database. Resend processes the email address to deliver the verification message. Pending verification records store only a random token hash, keyed email digest, challenge reference, optional pseudonym, and expiry. Tokens expire after 20 minutes and are deleted 24 hours after expiry. No child account, child email, photo, school, birth date, or location is requested.</p></section>
    <section><h2>Android availability</h2><p>Coming soon to Google Play. The Android email form is closed; the site and its former signup endpoint no longer collect launch emails. Closing the form does not delete any previously consented records. Existing records, if any, retain their original 90-day retention policy and may be removed through a privacy request to <Link href="mailto:info@roama.tech">info@roama.tech</Link>. Star-verification email is used only for verification and recovery, never marketing.</p></section>
    <section><h2>The Great Signal 2026</h2><p>Shadow Signal stars first verified between 20 December 2026 00:00 and 23 December 2026 00:00 in Europe/Istanbul appear in a separate blue layer. Recovering a previous star does not create or re-date a star. The event displays only star positions, aggregate totals and the number of participating countries, not names or individual locations. Cloudflare supplies an approximate country code for the adult verification request; no precise location is collected. Country codes remain private and are used only for aggregate country counts. Unknown countries are not guessed or counted. The star total is hidden while the campaign has fewer than 100 verified stars.</p></section>
    <section><h2>Public star names</h2><p>Giving a star a name is optional. The adult must explicitly confirm that the name is fictional, contains no personal information, and may be displayed publicly. Confirmed names appear immediately on the public star map; they are not reviewed before publication. Anyone can view or share a star by its number. Do not use a child&apos;s real name or any contact or identifying information.</p><p>The name stays associated with the star until an administrator removes it or the campaign data is deleted. Removing a name does not remove the completion or change the global total. Adults may contact <Link href="mailto:info@roama.tech">info@roama.tech</Link> to request removal of a public name. Basic input checks do not guarantee that a submitted name is safe or appropriate.</p></section>
    <section><h2>Retention, recovery and deletion</h2><p>The permanent star number, challenge reference, optional public pseudonym, and keyed adult-email digest are retained for the life of the permanent star so the campaign can enforce one star per adult email and recover an existing star. This keyed digest is pseudonymous data, not an anonymous record, and is not reversible by the campaign into the original email address. Verification tokens are removed 24 hours after expiry; rate-limit records are removed after 24 hours; abuse-prevention network hashes are removed 30 days after registration. Database backups follow the database provider&apos;s backup and retention controls.</p><p>An adult can contact <Link href="mailto:info@roama.tech">info@roama.tech</Link> to request removal of a public name or discuss an access/deletion request. Removing a name does not remove or renumber the permanent star. Because the keyed email digest is retained to prevent duplicate claims and support recovery, a deletion request may affect these functions; requests are reviewed individually.</p></section>
    <section><h2>Abuse prevention</h2><p>A keyed network hash is used for request throttling and review of unusual bursts. Email requests, token redemption, and public star lookup have database-backed rate limits shared across application instances. Cloudflare schedules daily deletion of completion abuse hashes older than 30 days, rate-limit records older than 24 hours, and expired verification tokens after 24 hours. Operators monitor scheduled maintenance and secure database backups.</p></section>
    <section><h2>Campaign analytics</h2><p>First-party aggregate event records may include campaign and challenge views, explicit challenge starts, self-reported challenge finishes, verification request starts, verified star claims, voluntary riddle-card downloads and shares, copied challenge links, and App Store clicks. A challenge finish is not a verified star claim and does not change the star counter. When a visitor arrives with campaign parameters, sanitized UTM source, medium, campaign and creative labels plus a random referral code are kept in sessionStorage for that tab session and carried into subsequent events. A new tagged arrival replaces the previous campaign attribution. Referral codes identify a link, not a person. These records are used to understand campaign activity and do not use advertising pixels, persistent tracking identities or device fingerprinting. Device type is read locally to select app options, not stored as a fingerprint. English is the default language; Turkish is selected explicitly with ?lang=tr. Adult email addresses, verification tokens, and child-identifying information are not intentionally added to analytics events. Sharing is optional and adult-controlled; no social-media post is required to receive a star.</p></section>
    <section><h2>Adult responsibility and safety</h2><p>An adult must supervise the activity, use the safety guidance, and submit their own email—not a child&apos;s. Adult confirmation records a report that the challenge was completed safely; it is not independent verification and does not constitute a universal legal parental-consent mechanism. Public pseudonyms are displayed immediately and are not pre-moderated. Do not include real names or other personal information.</p><p>This information describes the campaign&apos;s current data practices and is not legal advice. Requirements differ by country; the campaign operator should review applicable rules for each market where participation is promoted.</p></section>
    <p><Link className="text-link" href="/stars?lang=en">Explore the sky →</Link></p>
  </main></>;
}
