#!/usr/bin/env node
/* Assembles src/ into a single deployable dist/index.html.
   traits.js is the ONE source of truth -- the site and the generator read the same file. */
const fs = require('fs'), path = require('path');

const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');

// strip the node-only export block so it never ships to the browser
const traits = read('src/traits.js')
  .replace(/\/\* node export[\s\S]*$/m, '')
  .trimEnd();

const app  = read('src/app.js').trimEnd();
const out  = read('src/index.template.html')
  .replace('/*__TRAITS__*/', traits)
  .replace('/*__APP__*/', app);

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist/index.html'), out);

const kb = (Buffer.byteLength(out) / 1024).toFixed(1);
console.log(`dist/index.html  ${kb} KB`);
if (out.includes('/*__TRAITS__*/') || out.includes('/*__APP__*/'))
  { console.error('ERROR: injection marker left in output'); process.exit(1); }
if (out.includes('module.exports'))
  { console.error('ERROR: node export leaked into the browser bundle'); process.exit(1); }
console.log('build ok');
