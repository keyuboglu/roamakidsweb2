import type {Metadata} from 'next';
import VerifyEmail from '@/components/VerifyEmail';
import {serverLanguage} from '@/lib/server-language';

export async function generateMetadata():Promise<Metadata> {
  const tr=await serverLanguage()==='tr';
  return {title:tr?'E-postanızı doğrulayın — ROAMA Sinyal Macerası':'Verify your email — ROAMA Signal Quest',description:tr?'Kalıcı yıldızınızı görmek için yetişkin e-postanızı doğrulayın.':'Verify your adult email to reveal your permanent star.',robots:{index:false,follow:false}};
}

export default function VerifyEmailPage() {
  return <VerifyEmail/>;
}
