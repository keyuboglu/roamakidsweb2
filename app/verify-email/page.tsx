import type {Metadata} from 'next';
import VerifyEmail from '@/components/VerifyEmail';

export const metadata:Metadata={title:'Verify your email — ROAMA Signal Quest',robots:{index:false,follow:false}};

export default function VerifyEmailPage() {
  return <VerifyEmail/>;
}
