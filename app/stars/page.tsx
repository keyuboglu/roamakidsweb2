import type {Metadata} from 'next';
import StarMap from '@/components/StarMap';

export const metadata:Metadata={
  title:'A Million Stars — ROAMA Kids',
  description:'Explore one million places for real-world discoveries. Find and share your own named star in the Great Signal Quest.',
  alternates:{canonical:'/stars'},
};

export default function StarsPage() {
  return <StarMap/>;
}
