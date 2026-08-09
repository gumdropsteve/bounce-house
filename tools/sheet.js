const T=require('../src/traits.js'), fs=require('fs');
const {kids}=JSON.parse(fs.readFileSync('data/collection.json','utf8'));
const byIdx=i=>kids[i];
const card=(k,label,sub)=>{
  const r=T.RAR[k.tier], s=T.SKINS[k.skin];
  return `<figure class="c" style="--t:${r.c}"><div class="art">${T.drawKid(k)}</div>
  <figcaption><b>${label||T.TYPES[k.arch].name}</b><span>${sub!==undefined?sub:(s.id+' · '+k.attrCount+' attr')}</span></figcaption></figure>`;
};
const find=f=>kids.filter(f);
const sample=(arr,n)=>{const o=[...arr];const r=[];for(let i=0;i<n&&o.length;i++)r.push(o.splice(Math.floor(i*o.length/n)%o.length,1)[0]);return r;};

// tint the SKIN page by skin scarcity, not archetype tier
const skinBand=n=> n>=400?'#8FA3B8' : n>=150?'#3FBF5C' : n>=60?'#1F5EF5' : n>=30?'#8A4FE0' : n>=5?'#FFC61E' : '#F0402F';
const skinRow=T.SKINS.map(s=>{
  const i=T.SKINS.indexOf(s);
  const k=kids.find(x=>x.skin===i&&x.attrCount<=2)||kids.find(x=>x.skin===i);
  const r=T.RAR[k.tier];
  return `<figure class="c" style="--t:${skinBand(s.n)}"><div class="art">${T.drawKid(k)}</div>
  <figcaption><b>${s.id.toUpperCase()}</b><span>${s.n.toLocaleString()} of 10,000</span></figcaption></figure>`;
}).join('');
const archRow=T.TYPES.map((t,i)=>{const k=kids.find(x=>x.arch===i);return card(k,t.name,T.RAR[t.r].n);}).join('');
const rareRow=[
  ...find(k=>T.SKINS[k.skin].id==='deflated'),
  ...find(k=>T.SKINS[k.skin].id==='alien').slice(0,3),
  ...find(k=>k.attrCount===8),
  ...find(k=>k.attrCount===0).slice(0,3),
  ...find(k=>k.attrCount===7).slice(0,2),
  ...find(k=>k.tier===5).slice(0,2)
].map(k=>card(k,undefined,`${T.SKINS[k.skin].id} · ${k.attrCount} attr`)).join('');
const randRow=sample(kids,108).map(k=>card(k)).join('');

fs.writeFileSync('docs/contact-sheet.html',`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Bounce House — contact sheet</title>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@800&family=Space+Mono:wght@700&family=Archivo:wght@400;600&display=swap" rel="stylesheet">
<style>
body{margin:0;background:linear-gradient(180deg,#7FCDFF,#D9F0FF 40%,#EFFBE8);font-family:Archivo,sans-serif;color:#16223B;padding:32px}
.w{max-width:1500px;margin:0 auto}
h1{font-family:'Baloo 2';font-size:56px;margin:0;color:#FFC61E;text-shadow:0 4px 0 #E2A600,0 8px 0 #C98F00}
h2{font-family:'Baloo 2';font-size:30px;margin:52px 0 4px}
p.k{font-family:'Space Mono';font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#4A5975;margin:0 0 18px}
.g{display:grid;gap:12px}
.g11{grid-template-columns:repeat(11,1fr)}.g9{grid-template-columns:repeat(9,1fr)}.g12{grid-template-columns:repeat(12,1fr)}
@media(max-width:1200px){.g11,.g9,.g12{grid-template-columns:repeat(6,1fr)}}
.c{margin:0;background:#FFFDF6;border:3px solid #16223B;border-radius:14px;box-shadow:0 4px 0 #16223B;overflow:hidden}
.art{background:var(--t);background-image:repeating-linear-gradient(135deg,rgba(255,255,255,.5) 0 18px,rgba(255,255,255,0) 18px 36px);padding:6px 0 0;display:flex;justify-content:center}
.art svg{width:100%;height:auto;display:block}
figcaption{padding:6px;border-top:3px dashed rgba(22,34,59,.18);text-align:center}
figcaption b{display:block;font-family:'Baloo 2';font-size:12px;line-height:1.1}
figcaption span{font-family:'Space Mono';font-size:7.5px;color:#4A5975;text-transform:uppercase}
</style></head><body><div class="w">
<h1>BOUNCE HOUSE</h1><p class="k">10,000 generated · 0 duplicates · seed 20260808</p>
<h2>The eleven skins</h2><p class="k">tinted by SKIN scarcity — grey common, gold 14, red 1-of-1</p><div class="g g11">${skinRow}</div>
<h2>The eighteen archetypes</h2><p class="k">pose is the locked signature; everything else floats</p><div class="g g9">${archRow}</div>
<h2>The nameable rarities</h2><p class="k">deflated 1of1 · aliens · all-eight · zero-attribute · mythic</p><div class="g g12">${rareRow}</div>
<h2>108 at random</h2><p class="k">what the collection actually looks like</p><div class="g g12">${randRow}</div>
</div></body></html>`);
console.log('contact sheet written');
