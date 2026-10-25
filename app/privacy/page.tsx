import Link from 'next/link';

export const metadata={title:'Privacy information — ROAMA Kids'};

export default function Privacy() {
  return <main className="detail-page privacy-page">
    <Link href="/" className="detail-back">← The Great Signal Quest</Link>
    <p className="eyebrow">PRIVACY INFORMATION · DRAFT FOR REVIEW</p>
    <h1>Participation without a child account.</h1>
    <p className="detail-lede">This page describes the current implementation. The campaign owner must add its legal identity, contact details, retention commitments, and launch-market disclosures after legal review before promoting registration publicly.</p>
    <section><h2>What a completion stores</h2><p>When an adult organizer confirms a challenge, the system stores the challenge, registration time, an idempotency key, a permanent star number, an optional made-up star name, and a keyed hash of a network address used to limit repeated submissions. It does not ask for a child&apos;s real name, email, birth date, photograph, audio, school, or precise location.</p></section>
    <section><h2>Public star names</h2><p>Giving a star a name is optional. The adult must explicitly confirm that the name is fictional, contains no personal information, and may be displayed publicly. Confirmed names appear immediately on the public star map; they are not reviewed before publication. Anyone can view or share a star by its number. Do not use a child&apos;s real name or any contact or identifying information.</p><p>The name stays associated with the star until an administrator removes it or the campaign data is deleted. Removing a name does not remove the completion or change the global total. The operator must provide a privacy contact and a name-removal request procedure before public promotion. Basic input checks do not guarantee that a submitted name is safe or appropriate.</p></section>
    <section><h2>Abuse prevention</h2><p>A keyed network hash is used for request throttling and review of unusual bursts. Cloudflare deployments schedule daily deletion of completion abuse hashes older than 30 days and rate-limit records older than 24 hours. Operators must verify successful runs and secure database backups. Other hosting environments require their own documented maintenance schedule.</p></section>
    <section><h2>Campaign analytics</h2><p>First-party event records may include page or challenge views, completion-flow starts, confirmed registrations, voluntary shares, app-store clicks, and optional UTM source labels. The system does not intentionally add child-identifying information to these records.</p></section>
    <section><h2>Adult confirmation and safety</h2><p>An adult confirmation records a report that the challenge was completed safely. It is not independent verification and does not constitute a universal legal parental-consent mechanism.</p></section>
    <section><h2>Before launch</h2><p>The owner must supply a privacy contact and controller identity, define request and deletion procedures, review public names and analytics practices, set and verify retention jobs, and obtain jurisdiction-specific advice for each launch market. This draft is not legal advice or a compliance statement.</p></section>
    <p><Link className="text-link" href="/stars">Explore the sky →</Link></p>
  </main>;
}
