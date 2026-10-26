import type {Metadata} from 'next';
import Link from 'next/link';

export const metadata:Metadata={
  title:'Page not found | ROAMA Signal Quest',
  description:'This ROAMA Signal Quest page could not be found. Return to the campaign and choose one of the three family challenges.',
  robots:{index:false,follow:true},
};

export default function NotFound() {
  return <main className="detail-page">
    <p className="eyebrow">404 · PAGE NOT FOUND</p>
    <h1>This path has gone off course.</h1>
    <p className="detail-lede">The page may have moved, or the challenge link may be incorrect.</p>
    <p><Link className="text-link" href="/">Return to ROAMA Signal Quest →</Link></p>
    <p><Link className="text-link" href="/#challenges">Browse the three challenges →</Link></p>
  </main>;
}
