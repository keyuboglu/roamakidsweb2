import Image from 'next/image';
import Link from 'next/link';

export default function Brand() {
  return <Link className="brand" href="/" aria-label="ROAMA Kids quest home">
    <Image src="/roama-logo.webp" alt="" width={44} height={44} unoptimized/>
    <span>ROAMA <b>KIDS</b></span>
  </Link>;
}
