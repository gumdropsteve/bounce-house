/* ===========================================================
   BOUNCE HOUSE — trait engine
   Single source of truth for art + generation.
   Runs in Node (generator) and in the browser (site).
   =========================================================== */
'use strict';

var INK = '#16223B';

/* ---------- rarity tiers (archetype-level) ---------- */
var RAR = [
  { n:'COMMON',    w:5000, c:'#8FA3B8' },
  { n:'UNCOMMON',  w:2700, c:'#3FBF5C' },
  { n:'RARE',      w:1400, c:'#1F5EF5' },
  { n:'EPIC',      w:600,  c:'#8A4FE0' },
  { n:'LEGENDARY', w:260,  c:'#FFC61E' },
  { n:'MYTHIC',    w:40,   c:'#F0402F' }
];

/* ---------- 18 archetypes: pose is the locked signature ---------- */
var TYPES = [
 {r:0,name:'Sock Kid',            quip:'No shoes. No grip. No plan.',                 pose:'up',     shirt:'#F0402F'},
 {r:0,name:'The Sitter',          quip:'Bought the top. Sat down.',                   pose:'sit',    shirt:'#3FBF5C'},
 {r:0,name:'Wall Hugger',         quip:'Watching through the mesh. Never buys.',      pose:'crossed',shirt:'#8A4FE0'},
 {r:0,name:'Snack Guy',           quip:'Full send on the pizza, nothing else.',       pose:'up',     shirt:'#1F5EF5'},
 {r:0,name:'Crawler',             quip:'Still trying to stand up.',                   pose:'sit',    shirt:'#FFC61E'},
 {r:1,name:'Backflip Guy',        quip:'Nailed it once. Tells everyone. Never again.',pose:'flip',   shirt:'#F0402F'},
 {r:1,name:'The Crier',           quip:'Down ninety percent and extremely vocal.',    pose:'flail',  shirt:'#3FBF5C'},
 {r:1,name:'Sweaty Steve',        quip:'Six hours in. Will not stop. Cannot stop.',   pose:'flail',  shirt:'#1F5EF5'},
 {r:1,name:'Double Bouncer',      quip:'Sends everyone. Lands fine himself.',         pose:'up',     shirt:'#8A4FE0'},
 {r:2,name:'Shoeless Joe',        quip:'Lost the socks somewhere around hour two.',   pose:'flip',   shirt:'#FFC61E'},
 {r:2,name:'Birthday Kid',        quip:"It's his party. He's still exit liquidity.",  pose:'up',     shirt:'#F0402F'},
 {r:2,name:"Won't Leave",         quip:'Diamond socks. Physically removable only.',   pose:'up',     shirt:'#1F5EF5'},
 {r:3,name:'Party Dad',           quip:'Outside. On his phone. Quietly down bad.',    pose:'crossed',shirt:'#4A5975'},
 {r:3,name:'The Adult Who Got In',quip:'Far too big for this. Got in anyway.',        pose:'flail',  shirt:'#3FBF5C'},
 {r:4,name:'Blower Operator',     quip:'Knows exactly when it stops. Says nothing.',  pose:'crossed',shirt:'#16223B'},
 {r:4,name:'Compliance Officer',  quip:'Wrote the part you scrolled past.',           pose:'crossed',shirt:'#FF7A00', mod:{air:1,grip:99,exit:0}},
 {r:4,name:'Exit Liquidity Larry',quip:'Thanks, Larry. Really. Thank you.',           pose:'up',     shirt:'#F0402F'},
 {r:5,name:'MOM',                 quip:"Party's over. Everybody out. Shoes on.",      pose:'crossed',shirt:'#8A4FE0'}
];

/* ---------- skins: 11, weights out of 10,000 ---------- */
var SKINS = [
  {id:'porcelain', kind:'human', fill:'#FBD9BC', n:1935},
  {id:'sand',      kind:'human', fill:'#F6C9A0', n:1930},
  {id:'honey',     kind:'human', fill:'#E0A46F', n:1930},
  {id:'clay',      kind:'human', fill:'#B87A4B', n:1930},
  {id:'walnut',    kind:'human', fill:'#8A5A34', n:1450},
  {id:'espresso',  kind:'human', fill:'#5E3A21', n:480 },
  {id:'frog',      kind:'frog',  fill:'#6FC44B', n:200 },
  {id:'devil',     kind:'devil', fill:'#E0523F', n:90  },
  {id:'angel',     kind:'angel', fill:'#FDF3E3', n:45  },
  {id:'alien',     kind:'alien', fill:'#9FB8C8', n:9   },
  {id:'deflated',  kind:'deflated', fill:'#B7BCC4', n:1 }
];

var HAIRCOLORS = [
  {id:'black',n:'#241A12'},{id:'brown',n:'#3B2A1E'},{id:'auburn',n:'#8A4A20'},
  {id:'blonde',n:'#E3B457'},{id:'ginger',n:'#D2622A'},{id:'platinum',n:'#E8E2D4'},{id:'blue',n:'#2F6BFF'}
];
var HAIRSTYLES = ['bowl','spike','pigtails','bob','buzz','curls','mohawk'];

/* ---------- 8 optional attribute slots ---------- */
var SLOTS = [
  {k:'headwear',   v:['Party hat','Hard hat','Backwards cap','Paper crown','Sweatband','Bucket hat']},
  {k:'eyewear',    v:['Shades','Swim goggles','Glasses','Eye patch','24x24 Shades']},
  {k:'faceDetail', v:['Band-aid','Black eye','Face paint','Freckles','Tear streak','Juice mustache','Rug burn']},
  {k:'neck',       v:['Lanyard','Whistle','Gold medal','Scarf','Bib']},
  {k:'hands',      v:['Juice box','Phone','Clipboard','Car keys','Glow stick','Pizza slice','Balloon','Paper hands']},
  {k:'wrists',     v:['Wristband','Hospital band','Friendship bracelet','Watch']},
  {k:'sockQuirk',  v:['Mismatched','Striped','Holes in them','One sock only','Knee-highs','Diamond socks']},
  {k:'shirtPattern',v:['Stripes','Number 1','Tie-dye','Juice stain','Dinosaur','Solana']}
];

/* punk-style: bimodal. very few attrs and very many are both rare */
var ATTR_DIST = {0:8, 1:320, 2:2101, 3:3700, 4:2600, 5:1000, 6:250, 7:20, 8:1};

/* ---------- deterministic RNG (mulberry32) ---------- */
function rngFrom(seed){
  var a = seed >>> 0;
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function pickW(rng, items, wkey){
  var tot=0,i; for(i=0;i<items.length;i++) tot += items[i][wkey];
  var x = rng()*tot;
  for(i=0;i<items.length;i++){ x -= items[i][wkey]; if(x<=0) return items[i]; }
  return items[items.length-1];
}
function pick(rng, arr){ return arr[Math.floor(rng()*arr.length)]; }

/* ===========================================================
   ART
   =========================================================== */
function poseGeom(pose){
  var g={};
  if(pose==='up'){       g.arms='<path d="M30 70 Q14 56 18 38"/><path d="M70 70 Q86 56 82 38"/>';
                         g.legs='<path d="M42 96 Q34 112 26 118"/><path d="M58 96 Q66 112 74 118"/>';
                         g.feet=[[24,120],[76,120]]; g.hand=[18,38]; }
  else if(pose==='flail'){g.arms='<path d="M30 70 Q10 66 6 50"/><path d="M70 70 Q92 62 92 44"/>';
                         g.legs='<path d="M42 96 Q30 110 32 122"/><path d="M58 96 Q74 108 80 116"/>';
                         g.feet=[[32,124],[82,118]]; g.hand=[6,50]; }
  else if(pose==='sit'){ g.arms='<path d="M30 72 Q16 80 12 92"/><path d="M70 72 Q84 80 88 92"/>';
                         g.legs='<path d="M42 98 Q30 110 14 108"/><path d="M58 98 Q70 110 86 108"/>';
                         g.feet=[[12,109],[88,109]]; g.hand=[12,92]; }
  else if(pose==='crossed'){g.arms='<path d="M28 70 Q50 82 72 72"/><path d="M72 70 Q50 82 28 72"/>';
                         g.legs='<path d="M43 96 L40 120"/><path d="M57 96 L60 120"/>';
                         g.feet=[[39,122],[61,122]]; g.hand=[74,72]; }
  else {                 g.arms='<path d="M30 70 Q18 82 22 96"/><path d="M70 70 Q82 82 78 96"/>';
                         g.legs='<path d="M42 96 Q36 78 24 74"/><path d="M58 96 Q64 78 76 74"/>';
                         g.feet=[[22,72],[78,72]]; g.hand=[22,96]; g.flip=true; }
  return g;
}

function shirtPattern(p, shirt){
  if(!p) return '';
  var clip='<clipPath id="bc"><rect x="30" y="56" width="40" height="44" rx="19"/></clipPath>';
  var inner='';
  if(p==='Stripes')      inner='<g fill="#FFFDF6" opacity=".75"><rect x="28" y="62" width="44" height="6"/><rect x="28" y="76" width="44" height="6"/><rect x="28" y="90" width="44" height="6"/></g>';
  else if(p==='Number 1')inner='<text x="50" y="88" text-anchor="middle" font-family="Space Mono,monospace" font-size="30" font-weight="700" fill="#FFFDF6">1</text>';
  else if(p==='Tie-dye') inner='<g opacity=".55"><circle cx="42" cy="70" r="13" fill="#FFC61E"/><circle cx="60" cy="84" r="12" fill="#3FBF5C"/><circle cx="44" cy="92" r="9" fill="#1F5EF5"/></g>';
  else if(p==='Juice stain') inner='<path d="M40 74 q8 -5 14 2 q6 8 -2 13 q-10 5 -14 -4 z" fill="#8A2340" opacity=".8"/>';
  else if(p==='Dinosaur')inner='<path d="M38 88 l6 -12 4 6 5 -14 4 12 5 -6 3 14 z" fill="#3FBF5C"/>';
  else if(p==='Solana')  inner='<defs><linearGradient id="solg" x1="0" y1="1" x2="1" y2="0">'
    +'<stop offset="0" stop-color="#9945FF"/><stop offset="1" stop-color="#14F195"/></linearGradient></defs>'
    +'<g fill="url(#solg)">'
    +'<path d="M36 66 h26 l-6 7 h-26 z"/>'
    +'<path d="M30 77 h26 l6 7 h-26 z"/>'
    +'<path d="M36 88 h26 l-6 7 h-26 z"/></g>';
  return clip+'<g clip-path="url(#bc)">'+inner+'</g>';
}

function headByskin(sk, hairColor, style, hasHeadwear, eyewear, rng){
  var f=sk.fill, out='', face='';
  if(sk.kind==='alien'){
    out += '<ellipse cx="50" cy="32" rx="26" ry="29" fill="'+f+'" stroke="'+INK+'" stroke-width="4.5"/>';
    face = '<ellipse cx="40" cy="33" rx="7" ry="10" fill="'+INK+'" transform="rotate(-14 40 33)"/>'
         + '<ellipse cx="60" cy="33" rx="7" ry="10" fill="'+INK+'" transform="rotate(14 60 33)"/>'
         + '<path d="M44 48 q6 4 12 0" stroke="'+INK+'" stroke-width="3" fill="none" stroke-linecap="round"/>';
    return {head:out, face:face, hair:''};
  }
  if(sk.kind==='deflated'){
    out += '<ellipse cx="50" cy="38" rx="27" ry="20" fill="'+f+'" stroke="'+INK+'" stroke-width="4.5"/>';
    out += '<path d="M26 36 q10 6 24 4 q14 -2 24 -6" stroke="#9AA1AB" stroke-width="3" fill="none"/>';
    face = '<g stroke="'+INK+'" stroke-width="3.2" stroke-linecap="round" fill="none">'
         + '<path d="M38 34 L46 40 M46 34 L38 40"/><path d="M54 34 L62 40 M62 34 L54 40"/>'
         + '<path d="M42 48 q8 -4 16 0"/></g>';
    return {head:out, face:face, hair:''};
  }
  out += '<circle cx="50" cy="34" r="25" fill="'+f+'" stroke="'+INK+'" stroke-width="4.5"/>';
  var extra='';
  if(sk.kind==='frog'){
    extra = '<circle cx="36" cy="14" r="10" fill="'+f+'" stroke="'+INK+'" stroke-width="4"/>'
          + '<circle cx="64" cy="14" r="10" fill="'+f+'" stroke="'+INK+'" stroke-width="4"/>'
          + '<circle cx="36" cy="14" r="4" fill="'+INK+'"/><circle cx="64" cy="14" r="4" fill="'+INK+'"/>';
    face = '<path d="M32 40 q18 14 36 0" stroke="'+INK+'" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
         + '<circle cx="41" cy="33" r="2.4" fill="'+INK+'"/><circle cx="59" cy="33" r="2.4" fill="'+INK+'"/>';
    return {head:out+extra, face:face, hair:''};
  }
  if(sk.kind==='devil'){
    extra = '<path d="M30 16 q2 12 8 15 q-9 1 -14 -6 z" fill="'+f+'" stroke="'+INK+'" stroke-width="3.5" stroke-linejoin="round"/>'
          + '<path d="M70 16 q-2 12 -8 15 q9 1 14 -6 z" fill="'+f+'" stroke="'+INK+'" stroke-width="3.5" stroke-linejoin="round"/>';
  }
  if(sk.kind==='angel'){
    extra = '<ellipse cx="50" cy="2" rx="19" ry="6" fill="none" stroke="#FFC61E" stroke-width="5"/>';
  }
  /* hair (skipped when headwear covers it, kept for angel/devil/human) */
  var hair='';
  if(!hasHeadwear){
    if(style==='bowl')      hair='<path d="M28 32 Q50 6 72 32 Q50 22 28 32 Z" fill="'+hairColor+'"/>';
    else if(style==='spike')hair='<path d="M28 28 L34 10 L40 24 L48 6 L54 24 L62 10 L68 28 Z" fill="'+hairColor+'"/>';
    else if(style==='pigtails')hair='<path d="M28 32 Q50 8 72 32 Q50 22 28 32 Z" fill="'+hairColor+'"/><circle cx="19" cy="36" r="11" fill="'+hairColor+'"/><circle cx="81" cy="36" r="11" fill="'+hairColor+'"/>';
    else if(style==='bob')  hair='<path d="M25 36 Q26 6 50 6 Q74 6 75 36 L69 34 Q50 20 31 34 Z" fill="'+hairColor+'"/>';
    else if(style==='buzz') hair='<path d="M27 30 Q50 10 73 30 Q50 24 27 30 Z" fill="'+hairColor+'" opacity=".85"/>';
    else if(style==='curls')hair='<g fill="'+hairColor+'"><circle cx="33" cy="22" r="9"/><circle cx="46" cy="14" r="10"/><circle cx="60" cy="15" r="9"/><circle cx="70" cy="25" r="8"/></g>';
    else if(style==='mohawk')hair='<path d="M50 2 L58 30 L42 30 Z" fill="'+hairColor+'"/><rect x="44" y="26" width="12" height="6" fill="'+hairColor+'"/>';
  }
  /* face */
  if(eyewear==='Shades')          face='<rect x="33" y="27" width="34" height="11" rx="4" fill="'+INK+'"/><path d="M43 46 q7 4 14 0" stroke="'+INK+'" stroke-width="3.2" fill="none" stroke-linecap="round"/>';
  else if(eyewear==='Swim goggles')face='<g fill="none" stroke="'+INK+'" stroke-width="3.2"><circle cx="41" cy="32" r="7"/><circle cx="59" cy="32" r="7"/><path d="M48 32 h4"/><path d="M34 30 L26 27 M66 30 L74 27"/></g><path d="M43 46 q7 4 14 0" stroke="'+INK+'" stroke-width="3.2" fill="none" stroke-linecap="round"/>';
  else if(eyewear==='Glasses')    face='<g fill="none" stroke="'+INK+'" stroke-width="3"><rect x="33" y="26" width="15" height="12" rx="3"/><rect x="52" y="26" width="15" height="12" rx="3"/><path d="M48 32 h4"/></g><path d="M43 46 q7 4 14 0" stroke="'+INK+'" stroke-width="3.2" fill="none" stroke-linecap="round"/>';
  else if(eyewear==='24x24 Shades')face='<g shape-rendering="crispEdges"><rect x="31" y="26" width="16" height="5" fill="#1F5EF5"/><rect x="31" y="31" width="16" height="5" fill="#16223B"/><rect x="53" y="26" width="16" height="5" fill="#1F5EF5"/><rect x="53" y="31" width="16" height="5" fill="#16223B"/><rect x="47" y="28" width="6" height="4" fill="#16223B"/></g><path d="M43 46 q7 4 14 0" stroke="'+INK+'" stroke-width="3.2" fill="none" stroke-linecap="round"/>';
  else if(eyewear==='Eye patch')  face='<path d="M32 26 L68 30" stroke="'+INK+'" stroke-width="3"/><rect x="34" y="26" width="15" height="13" rx="3" fill="'+INK+'"/><circle cx="59" cy="32" r="3.2" fill="'+INK+'"/><path d="M43 46 q7 4 14 0" stroke="'+INK+'" stroke-width="3.2" fill="none" stroke-linecap="round"/>';
  else {
    var mood = rng ? Math.floor(rng()*4) : 0;
    if(mood===0)      face='<path d="M40 32 q4 -6 8 0" stroke="'+INK+'" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M52 32 q4 -6 8 0" stroke="'+INK+'" stroke-width="3.2" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="43" rx="8" ry="7" fill="'+INK+'"/>';
    else if(mood===1) face='<circle cx="42" cy="32" r="3.4" fill="'+INK+'"/><circle cx="58" cy="32" r="3.4" fill="'+INK+'"/><ellipse cx="50" cy="45" rx="9" ry="10" fill="'+INK+'"/>';
    else if(mood===2) face='<circle cx="42" cy="32" r="3" fill="'+INK+'"/><circle cx="58" cy="32" r="3" fill="'+INK+'"/><path d="M42 45 L58 45" stroke="'+INK+'" stroke-width="3.2" stroke-linecap="round"/>';
    else              face='<path d="M39 30 q4 5 8 0" stroke="'+INK+'" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M53 30 q4 5 8 0" stroke="'+INK+'" stroke-width="3.2" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="45" rx="8" ry="8" fill="'+INK+'"/>';
  }
  return {head:out+extra, face:face, hair:hair};
}

function attrSVG(k, g){
  var a=k.attrs, out='';
  /* neck */
  if(a.neck==='Lanyard')     out+='<path d="M41 57 L50 76 L59 57" stroke="'+INK+'" stroke-width="3" fill="none"/><rect x="42" y="74" width="16" height="20" rx="3" fill="#FFFDF6" stroke="'+INK+'" stroke-width="3"/>';
  else if(a.neck==='Whistle')out+='<path d="M42 57 L50 74 L58 57" stroke="'+INK+'" stroke-width="2.6" fill="none"/><rect x="45" y="72" width="13" height="8" rx="3" fill="#FFC61E" stroke="'+INK+'" stroke-width="2.6"/>';
  else if(a.neck==='Gold medal')out+='<path d="M42 56 L50 72 L58 56" stroke="#1F5EF5" stroke-width="3.4" fill="none"/><circle cx="50" cy="78" r="8" fill="#FFC61E" stroke="'+INK+'" stroke-width="3"/>';
  else if(a.neck==='Scarf')  out+='<path d="M32 58 q18 10 36 0 l0 8 q-18 9 -36 0 z" fill="#F0402F" stroke="'+INK+'" stroke-width="3"/><path d="M64 64 l6 16" stroke="#F0402F" stroke-width="6" stroke-linecap="round"/>';
  else if(a.neck==='Bib')    out+='<path d="M36 58 q14 10 28 0 q4 20 -14 22 q-18 -2 -14 -22 z" fill="#FFFDF6" stroke="'+INK+'" stroke-width="3"/>';
  /* headwear */
  if(a.headwear==='Party hat')       out+='<path d="M50 -8 L36 20 L64 20 Z" fill="#F0402F" stroke="'+INK+'" stroke-width="3.5" stroke-linejoin="round"/><circle cx="50" cy="-10" r="5" fill="#FFC61E" stroke="'+INK+'" stroke-width="3"/>';
  else if(a.headwear==='Hard hat')   out+='<path d="M27 31 Q50 3 73 31 Z" fill="#FFC61E" stroke="'+INK+'" stroke-width="3.5" stroke-linejoin="round"/><rect x="19" y="28" width="62" height="8" rx="4" fill="#FFC61E" stroke="'+INK+'" stroke-width="3.5"/>';
  else if(a.headwear==='Backwards cap') out+='<path d="M27 30 Q50 6 73 30 Z" fill="#1F5EF5" stroke="'+INK+'" stroke-width="3"/><path d="M73 30 L86 34 L73 38 Z" fill="#1F5EF5" stroke="'+INK+'" stroke-width="3" stroke-linejoin="round"/>';
  else if(a.headwear==='Paper crown')out+='<path d="M28 26 L28 8 L38 18 L50 4 L62 18 L72 8 L72 26 Z" fill="#FFC61E" stroke="'+INK+'" stroke-width="3.2" stroke-linejoin="round"/>';
  else if(a.headwear==='Sweatband')  out+='<rect x="25" y="20" width="50" height="10" rx="5" fill="#F0402F" stroke="'+INK+'" stroke-width="3"/>';
  else if(a.headwear==='Bucket hat') out+='<path d="M30 24 q20 -18 40 0 z" fill="#3FBF5C" stroke="'+INK+'" stroke-width="3"/><path d="M20 24 q30 12 60 0 q-4 10 -30 10 q-26 0 -30 -10 z" fill="#3FBF5C" stroke="'+INK+'" stroke-width="3" stroke-linejoin="round"/>';
  /* face detail */
  if(a.faceDetail==='Band-aid')      out+='<rect x="55" y="20" width="16" height="7" rx="3" fill="#FBD9BC" stroke="'+INK+'" stroke-width="2.4" transform="rotate(-18 63 23)"/>';
  else if(a.faceDetail==='Black eye')out+='<circle cx="58" cy="32" r="8" fill="#8A4FE0" opacity=".55"/>';
  else if(a.faceDetail==='Face paint')out+='<path d="M32 36 q8 4 0 8" stroke="#F0402F" stroke-width="3" fill="none"/><path d="M68 36 q-8 4 0 8" stroke="#F0402F" stroke-width="3" fill="none"/><path d="M50 14 q-6 6 0 10 q6 -4 0 -10" fill="#1F5EF5"/>';
  else if(a.faceDetail==='Freckles') out+='<g fill="#B87A4B" opacity=".8"><circle cx="36" cy="40" r="1.8"/><circle cx="41" cy="43" r="1.8"/><circle cx="59" cy="43" r="1.8"/><circle cx="64" cy="40" r="1.8"/></g>';
  else if(a.faceDetail==='Tear streak')out+='<path d="M42 37 q-3 10 -1 16" stroke="#7FCDFF" stroke-width="3" fill="none" stroke-linecap="round"/>';
  else if(a.faceDetail==='Rug burn')out+='<g stroke="#D6453A" stroke-width="2.4" stroke-linecap="round" opacity=".85"><path d="M60 42 l8 3"/><path d="M59 46 l9 2"/><path d="M60 50 l7 1"/></g>';
  else if(a.faceDetail==='Juice mustache')out+='<path d="M40 50 q10 5 20 0 q-10 4 -20 0" fill="#8A2340" opacity=".85"/>';
  /* hands */
  var hx=g.hand[0], hy=g.hand[1];
  if(a.hands==='Juice box')       out+='<rect x="'+(hx-8)+'" y="'+(hy-6)+'" width="16" height="21" rx="3" fill="#FFC61E" stroke="'+INK+'" stroke-width="3"/><path d="M'+(hx+4)+' '+(hy-6)+' l3 -11" stroke="'+INK+'" stroke-width="3"/>';
  else if(a.hands==='Phone')      out+='<rect x="'+(hx-9)+'" y="'+(hy-9)+'" width="18" height="26" rx="4" fill="'+INK+'"/><rect x="'+(hx-6)+'" y="'+(hy-5)+'" width="12" height="17" rx="2" fill="#7FCDFF"/>';
  else if(a.hands==='Clipboard')  out+='<rect x="'+(hx-11)+'" y="'+(hy-8)+'" width="22" height="28" rx="3" fill="#FFFDF6" stroke="'+INK+'" stroke-width="3"/><path d="M'+(hx-6)+' '+(hy+1)+' h12 M'+(hx-6)+' '+(hy+8)+' h12" stroke="'+INK+'" stroke-width="2.4"/>';
  else if(a.hands==='Car keys')   out+='<circle cx="'+hx+'" cy="'+hy+'" r="6" fill="none" stroke="'+INK+'" stroke-width="3.4"/><path d="M'+(hx+5)+' '+(hy+2)+' l11 8 M'+(hx+12)+' '+(hy+6)+' l-3 4" stroke="'+INK+'" stroke-width="3.4"/>';
  else if(a.hands==='Glow stick') out+='<rect x="'+(hx-4)+'" y="'+(hy-12)+'" width="9" height="26" rx="4.5" fill="#5CF08A" stroke="'+INK+'" stroke-width="2.8" transform="rotate(24 '+hx+' '+hy+')"/>';
  else if(a.hands==='Pizza slice')out+='<path d="M'+(hx-10)+' '+(hy+10)+' L'+hx+' '+(hy-11)+' L'+(hx+10)+' '+(hy+10)+' Z" fill="#FFC61E" stroke="'+INK+'" stroke-width="3" stroke-linejoin="round"/><circle cx="'+hx+'" cy="'+(hy+2)+'" r="2.4" fill="#F0402F"/>';
  else if(a.hands==='Paper hands')out+='<path d="M'+(hx-9)+' '+(hy-9)+' l18 -4 l3 20 l-18 5 z" fill="#FFFDF6" stroke="'+INK+'" stroke-width="2.8" stroke-linejoin="round"/><path d="M'+(hx-4)+' '+(hy-6)+' l14 -3 M'+(hx-3)+' '+(hy+1)+' l14 -3" stroke="'+INK+'" stroke-width="2"/>';
  else if(a.hands==='Balloon')    out+='<path d="M'+hx+' '+hy+' q6 -16 2 -30" stroke="'+INK+'" stroke-width="2.2" fill="none"/><ellipse cx="'+(hx+1)+'" cy="'+(hy-38)+'" rx="11" ry="13" fill="#F0402F" stroke="'+INK+'" stroke-width="3"/>';
  return out;
}

function socksSVG(k, g){
  var q=k.attrs.sockQuirk, base='#FFFDF6', alt='#FFC61E', out='';
  var f=g.feet;
  function sock(x,y,fill,r){ return '<circle cx="'+x+'" cy="'+y+'" r="'+(r||8)+'" fill="'+fill+'" stroke="'+INK+'" stroke-width="4"/>'; }
  if(q==='Mismatched'){ out+=sock(f[0][0],f[0][1],'#F0402F'); out+=sock(f[1][0],f[1][1],'#3FBF5C'); }
  else if(q==='One sock only'){ out+=sock(f[0][0],f[0][1],base); }
  else if(q==='Holes in them'){ out+=sock(f[0][0],f[0][1],base)+'<circle cx="'+f[0][0]+'" cy="'+f[0][1]+'" r="3" fill="#E0A46F"/>'; out+=sock(f[1][0],f[1][1],base); }
  else if(q==='Knee-highs'){ out+=sock(f[0][0],f[0][1],alt,10); out+=sock(f[1][0],f[1][1],alt,10); }
  else if(q==='Diamond socks'){
    out+='<path d="M'+f[0][0]+' '+(f[0][1]-9)+' l9 9 l-9 9 l-9 -9 z" fill="#BFF3FF" stroke="'+INK+'" stroke-width="3.4"/>';
    out+='<path d="M'+f[1][0]+' '+(f[1][1]-9)+' l9 9 l-9 9 l-9 -9 z" fill="#BFF3FF" stroke="'+INK+'" stroke-width="3.4"/>';
  }
  else if(q==='Striped'){ out+=sock(f[0][0],f[0][1],base)+'<path d="M'+(f[0][0]-7)+' '+f[0][1]+' h14" stroke="#F0402F" stroke-width="3"/>';
                          out+=sock(f[1][0],f[1][1],base)+'<path d="M'+(f[1][0]-7)+' '+f[1][1]+' h14" stroke="#F0402F" stroke-width="3"/>'; }
  else { out+=sock(f[0][0],f[0][1],base); out+=sock(f[1][0],f[1][1],base); }
  return out;
}

function drawKid(k, opts){
  opts = opts || {};
  var t = TYPES[k.arch], sk = SKINS[k.skin], g = poseGeom(t.pose);
  var rng = rngFrom(k.index * 2654435761 + 7);
  var hc = HAIRCOLORS[k.hairColor].n;
  var h = headByskin(sk, hc, HAIRSTYLES[k.hairStyle], !!k.attrs.headwear, k.attrs.eyewear, rng);

  var wrist = '';
  if(k.attrs.wrists){
    var c = k.attrs.wrists==='Hospital band' ? '#FFFDF6' : (k.attrs.wrists==='Watch' ? '#16223B' : '#F0402F');
    wrist = '<circle cx="'+g.hand[0]+'" cy="'+(g.hand[1]+9)+'" r="5" fill="'+c+'" stroke="'+INK+'" stroke-width="2.6"/>';
  }

  var inner =
      '<g stroke="'+INK+'" stroke-width="4.5" stroke-linecap="round" fill="none">'+g.arms+g.legs+'</g>'
    + '<rect x="30" y="56" width="40" height="44" rx="19" fill="'+t.shirt+'"/>'
    + shirtPattern(k.attrs.shirtPattern, t.shirt)
    + '<rect x="30" y="56" width="40" height="44" rx="19" fill="none" stroke="'+INK+'" stroke-width="4.5"/>'
    + socksSVG(k, g) + wrist
    + h.head + h.hair + h.face
    + attrSVG(k, g);

  var body = g.flip ? '<g transform="rotate(180 50 60)">'+inner+'</g>' : inner;
  return '<svg viewBox="-16 -52 132 190" xmlns="http://www.w3.org/2000/svg">'+body+'</svg>';
}

/* ===========================================================
   GENERATION
   =========================================================== */
function attrCountFor(rng){
  var tot=0,k; for(k in ATTR_DIST) tot+=ATTR_DIST[k];
  var x=rng()*tot;
  for(k in ATTR_DIST){ x-=ATTR_DIST[k]; if(x<=0) return +k; }
  return 3;
}

function makeKid(rng, index, tierIdx){
  var pool = [];
  for(var i=0;i<TYPES.length;i++) if(TYPES[i].r===tierIdx) pool.push(i);
  var arch = pool[Math.floor(rng()*pool.length)];
  var skin = SKINS.indexOf(pickW(rng, SKINS, 'n'));

  var n = attrCountFor(rng);
  var idxs=[]; for(var s=0;s<SLOTS.length;s++) idxs.push(s);
  for(var j=idxs.length-1;j>0;j--){ var q=Math.floor(rng()*(j+1)); var tmp=idxs[j]; idxs[j]=idxs[q]; idxs[q]=tmp; }
  var attrs={};
  for(var m=0;m<n;m++){ var sl=SLOTS[idxs[m]]; attrs[sl.k]=pick(rng, sl.v); }

  return { index:index, arch:arch, skin:skin, hairColor:Math.floor(rng()*HAIRCOLORS.length),
           hairStyle:Math.floor(rng()*HAIRSTYLES.length), attrs:attrs, attrCount:n, tier:tierIdx };
}

function fingerprint(k){
  var a=k.attrs, parts=[k.arch,k.skin,k.hairColor,k.hairStyle];
  for(var i=0;i<SLOTS.length;i++) parts.push(a[SLOTS[i].k]||'-');
  return parts.join('|');
}

/* Build tier pools. Burn size decides which pool you draw from at mint time,
   so uniqueness holds without the burn curve being overridden by mint order. */
function deck(rng, items, countKey, total){
  /* exact counts, then shuffle -- rarity claims become verifiable, not approximate */
  var d=[],i,j;
  for(i=0;i<items.length;i++){
    var n = countKey ? items[i][countKey] : items[i].n;
    for(j=0;j<n;j++) d.push(i);
  }
  while(d.length < total) d.push(0);
  d.length = total;
  for(i=d.length-1;i>0;i--){ var q=Math.floor(rng()*(i+1)); var t=d[i]; d[i]=d[q]; d[q]=t; }
  return d;
}

function buildCollection(total, seed){
  var rng = rngFrom(seed), seen = {}, out = [], collisions = 0, i;
  var tot=0; for(i=0;i<RAR.length;i++) tot+=RAR[i].w;
  var quota = RAR.map(function(r){ return Math.round(total * r.w / tot); });
  quota[0] += total - quota.reduce(function(a,b){return a+b;},0);

  /* exact skin deck, scaled to total */
  var scale = total/10000;
  var skinItems = SKINS.map(function(s){ return {n: Math.max(s.n<=1?1:1, Math.round(s.n*scale))}; });
  var skinDeck = deck(rng, skinItems, 'n', total);

  /* exact attribute-count deck */
  var acItems=[], keys=Object.keys(ATTR_DIST).sort(function(a,b){return a-b;});
  for(i=0;i<keys.length;i++) acItems.push({v:+keys[i], n:Math.max(ATTR_DIST[keys[i]]<=1?1:1, Math.round(ATTR_DIST[keys[i]]*scale))});
  var acDeckIdx = deck(rng, acItems, 'n', total);

  var index=0;
  for(var tier=0; tier<RAR.length; tier++){
    for(var c=0; c<quota[tier]; c++){
      var k, fp, guard=0;
      do {
        k = makeKid(rng, index, tier);
        k.skin = skinDeck[index];
        var want = acItems[acDeckIdx[index]].v;
        k = reattr(rng, k, want);
        fp = fingerprint(k); guard++; if(guard>1) collisions++;
      } while(seen[fp] && guard < 500);
      seen[fp]=true; out.push(k); index++;
    }
  }
  return { kids: out, collisions: collisions, quota: quota };
}

function reattr(rng, k, want){
  var idxs=[],s; for(s=0;s<SLOTS.length;s++) idxs.push(s);
  for(var j=idxs.length-1;j>0;j--){ var q=Math.floor(rng()*(j+1)); var t=idxs[j]; idxs[j]=idxs[q]; idxs[q]=t; }
  var attrs={};
  for(var m=0;m<want;m++){ var sl=SLOTS[idxs[m]]; attrs[sl.k]=pick(rng, sl.v); }
  k.attrs=attrs; k.attrCount=want; return k;
}

/* node export -- browser build strips nothing, this is just ignored there */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { INK, RAR, TYPES, SKINS, HAIRCOLORS, HAIRSTYLES, SLOTS, ATTR_DIST,
                     drawKid, buildCollection, fingerprint, rngFrom, makeKid, attrCountFor, pick, pickW };
}
