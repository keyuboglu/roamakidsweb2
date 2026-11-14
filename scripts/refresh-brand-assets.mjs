import sharp from 'sharp';
import {readFile} from 'node:fs/promises';

const icon=await sharp('public/roama-logo.webp').resize(100,100).png().toBuffer();
const wordmark=await sharp('public/roama-wordmark.webp').resize({width:260}).png().toBuffer();
const escape=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;');
for(const language of ['en','tr']){
  for(const slug of ['', 'shadow-signal','micro-world-safari','gravity-defier']){
    const title=language==='tr'?'ROAMA Kids · Sinyal Görevi':'ROAMA Kids · Signal Quest';
    const names=language==='tr'?{'shadow-signal':'Gölge İşareti','micro-world-safari':'Mikro Dünya Safarisi','gravity-defier':'Yerçekimine Meydan Oku'}:{'shadow-signal':'Shadow Signal','micro-world-safari':'The Micro-World Safari','gravity-defier':'The Gravity Defier'};
    const subtitle=slug?names[slug]:language==='tr'?'Birlikte keşfedin. Bir yıldız yakın.':'Discover together. Light a star.';
    const label=language==='tr'?'6–12 yaş · Bir yetişkinle · Üç ücretsiz görev':'Ages 6–12 · With a grown-up · Three free challenges';
    const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#0b1426"/><text x="60" y="280" fill="#f5f0e6" font-family="Arial" font-size="40">${escape(title)}</text><text x="60" y="355" fill="#e7c374" font-family="Arial" font-size="30">${escape(subtitle)}</text><text x="60" y="440" fill="#c2c9d3" font-family="Arial" font-size="23">${escape(label)}</text><text x="60" y="555" fill="#e7c374" font-family="Arial" font-size="26">signalquest.roama.tech</text></svg>`);
    const layers=[{input:icon,left:60,top:50},{input:wordmark,left:180,top:30}];
    if(slug)layers.push({input:await sharp(await readFile(`public/images/challenges/${slug}.png`)).resize({height:570}).png().toBuffer(),left:700,top:30});
    const output=await sharp(svg).composite(layers).png().toBuffer();
    await sharp(output).toFile(`public/og-${slug||'great-signal'}${language==='tr'?'-tr':''}.png`);
  }
}
