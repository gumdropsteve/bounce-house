const T = require('../src/traits.js');
const fs = require('fs');

const TOTAL = 10000, SEED = 20260808;
const { kids, collisions, quota } = T.buildCollection(TOTAL, SEED);

// uniqueness proof
const fps = new Set(kids.map(T.fingerprint));
console.log(`generated: ${kids.length}   unique fingerprints: ${fps.size}   dupes: ${kids.length-fps.size}`);
console.log(`retries during generation: ${collisions}`);
console.log(`tier quota: ${quota.map((q,i)=>T.RAR[i].n+'='+q).join('  ')}`);

// rarity report
const tally = (fn) => kids.reduce((m,k)=>{const v=fn(k);m[v]=(m[v]||0)+1;return m;},{});
const skinT = tally(k=>T.SKINS[k.skin].id);
const attrT = tally(k=>k.attrCount);
console.log('\nSKIN:');
T.SKINS.forEach(s=>console.log(`  ${s.id.padEnd(11)} ${String(skinT[s.id]||0).padStart(5)}  ${(((skinT[s.id]||0)/TOTAL)*100).toFixed(2)}%`));
console.log('\nATTRIBUTE COUNT:');
Object.keys(attrT).sort((a,b)=>a-b).forEach(n=>console.log(`  ${n} attrs  ${String(attrT[n]).padStart(5)}`));

fs.writeFileSync('data/collection.json', JSON.stringify({seed:SEED,total:TOTAL,kids},null,0));
console.log(`\ncollection.json written (${(fs.statSync('data/collection.json').size/1024/1024).toFixed(2)} MB)`);
