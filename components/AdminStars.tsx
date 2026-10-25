'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import type {PublicStar} from '@/lib/stars';

type NamedStar=PublicStar&{challenge:{title:string}};

export default function AdminStars() {
  const [stars,setStars]=useState<NamedStar[]>([]);
  const [before,setBefore]=useState<number|undefined>();
  const [nextBefore,setNextBefore]=useState<number|null>(null);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState<number|null>(null);
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    const load=async()=>{
      try {
        const response=await fetch(`/api/admin/stars${before?`?before=${before}`:''}`,{signal:controller.signal,cache:'no-store'});
        const data=await response.json();
        if(!response.ok)throw new Error(data.error||'Star names could not load.');
        setStars(data.stars);
        setNextBefore(data.nextBefore);
        setError('');
      } catch(error) {
        if(!controller.signal.aborted)setError(error instanceof Error?error.message:'Star names could not load.');
      }
    };
    void load();
    return ()=>controller.abort();
  },[before,retry]);

  async function removeName(starNumber:number) {
    if(!window.confirm(`Remove the public name from star #${starNumber}? The star and completion will remain.`))return;
    setBusy(starNumber);
    setError('');
    setNotice('');
    try {
      const response=await fetch('/api/admin/stars',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({starNumber})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'The name could not be removed.');
      setStars(current=>current.filter(star=>star.starNumber!==starNumber));
      setNotice('Name removed. The star remains lit. Open maps refresh within about 30 seconds.');
    } catch(error) {
      setError(error instanceof Error?error.message:'The name could not be removed.');
    } finally {
      setBusy(null);
    }
  }

  return <section className="admin-panel"><h2>Public star names</h2><p className="report-note">Names appear immediately after adult confirmation. Remove personal information or inappropriate names here without changing the completion count.</p>
    {error&&<p className="form-error" role="alert">{error} <button onClick={()=>setRetry(value=>value+1)}>Try again</button></p>}
    {notice&&<p className="report-note" role="status">{notice}</p>}
    {!stars.length&&!error&&<p className="report-note">No named stars on this page.</p>}
    {stars.map(star=><div className="star-admin-row" key={star.starNumber}><div><strong>{star.starName}</strong><small><Link href={`/stars?star=${star.starNumber}`}>Star #{star.starNumber.toLocaleString('en-US')} ↗</Link> · {star.challenge.title}</small></div><button disabled={busy!==null} onClick={()=>void removeName(star.starNumber)}>{busy===star.starNumber?'Removing…':'Remove name'}</button></div>)}
    <div className="admin-stars-footer">{before&&<button className="share-button" onClick={()=>setBefore(undefined)}>Latest stars</button>}{nextBefore&&<button className="share-button" onClick={()=>setBefore(nextBefore)}>Older stars →</button>}</div>
  </section>;
}
