var RULES=[
 {h:'Shoes off',p:'And with them: due diligence, position sizing, and any sentence that begins "the fundamentals here."'},
 {h:'The blower must stay on',p:'A bounce house is structurally sound only while air is being pumped into it. Nobody in here knows who is paying the electric bill.'},
 {h:'Everybody bounces',p:'Going up is the easy part and it happens to everyone at once. Landing is the part that gets distributed unevenly.'},
 {h:'Double-bouncing is legal',p:'If you time your jump to send somebody else into the ceiling, that is between them and the ceiling.'},
 {h:'The adults are outside',p:'They are on their phones. They can see you through the mesh. They are not coming in and they are not stopping anything.'},
 {h:'It deflates',p:'Not if. The vinyl goes slack, the walls fold in, and everyone crawls out the side. This has happened at every bounce house that has ever existed.'},
 {h:'Act surprised',p:'When it does, the correct move is to stand on the flattened floor and say nobody could have seen this coming.'},
 {h:'There is no refund desk',p:'There was never a cashier. You walked in through an inflatable arch. What exactly did you expect to be behind it.'}
];

/* ================= app ================= */
var Store=(function(){
  var mem={},ws=(typeof window!=='undefined'&&window.storage&&typeof window.storage.get==='function'),ls=null;
  try{localStorage.setItem('__bh','1');localStorage.removeItem('__bh');ls=localStorage;}catch(e){ls=null;}
  return{get:function(k){
      if(ws)return window.storage.get(k).then(function(r){return r?r.value:null;}).catch(function(){return ls?ls.getItem(k):null;});
      if(ls){try{return Promise.resolve(ls.getItem(k));}catch(e){}}
      return Promise.resolve(k in mem?mem[k]:null);},
    set:function(k,v){
      if(ws)return window.storage.set(k,v).catch(function(){if(ls){try{ls.setItem(k,v);}catch(e){}}mem[k]=v;});
      if(ls){try{ls.setItem(k,v);return Promise.resolve();}catch(e){}}
      mem[k]=v;return Promise.resolve();}};
})();

var GEN_CAP=10000, MOM_CAP=55, A=0.30, KK=1.6, SLOT3_MIN=100000;
/* hard population caps -- once reached, never minted again */
var CAP_ARCH={'MOM':55,'Blower Operator':100,'Compliance Officer':250,'Exit Liquidity Larry':500};
var CAP_TRAIT={'Solana':100,'24x24 Shades':100,'Diamond socks':100,'Paper hands':500};
var W_GEN=[5000,2700,1400,600,260,40];
var freed=40*0.5+260*0.3+600*0.1;
var W_POST=[5000+freed,2700,1400,540,182,20];
var W_DRY=[5000+freed,2700,1400,540,202,0];

var FORGE={0:{need:3,p:[20,47,21,8.5,3.1,0.4]},
           1:{need:4,p:[8,30,42,15,4.6,0.4]},
           2:{need:5,p:[1,8,26,52,12.6,0.4]},
           3:{need:6,p:[0.5,3,12,30,53.7,0.8]}};

var state={signed:false,burn:100000,rerolls:0,sel:0,slots:[null,null,null],
           free:[3,3,3],vault:[],genMinted:0,momMinted:0,uid:1,cArch:{},cTrait:{}};

function save(){Store.set('bounce:v4',JSON.stringify(state));}

function phase(){ if(state.momMinted>=MOM_CAP)return 2; if(state.genMinted>=GEN_CAP)return 1; return 0; }
function weights(){ return [W_GEN,W_POST,W_DRY][phase()]; }
function tParam(B){ return Math.max(0,Math.min(1,(Math.log(B)/Math.LN10-5)/2)); }
function oddsFor(B){
  var base=weights(),t=tParam(B),L=1+A*t;
  var w=[base[0]*Math.pow(1-t,KK)];
  for(var i=1;i<6;i++) w.push(base[i]*Math.pow(L,i));
  var s=0;for(i=0;i<6;i++)s+=w[i];
  return w.map(function(x){return x/s;});
}
function sliderToBurn(v){ var e=4+(v/1000)*3; return Math.round(Math.pow(10,e)/1000)*1000; }
function fmtB(n){ return n>=1000000?(n/1000000).toFixed(n%1000000?2:0)+'M':(n/1000).toFixed(0)+'K'; }

function cooldownFor(n,B){
  var base = n<3?0 : n<6?3000 : n<9?7000 : n<100?11000 : 100000;
  return Math.round(base*(1-0.9*tParam(B)));
}

/* ---- rolling ---- */
function pickTier(p){ var x=Math.random(),c=0; for(var i=0;i<6;i++){c+=p[i]; if(x<=c)return i;} return 0; }
function cappedTraitTags(k){
  var out='';
  for(var i=0;i<SLOTS.length;i++){
    var v=k.attrs[SLOTS[i].k]; if(!v) continue;
    var c=CAP_TRAIT[v]; if(c===undefined) continue;
    out+='<span class="tag2 cap">'+v+' \u00b7 limit '+c.toLocaleString()+'</span>';
  }
  return out;
}
function capNote(kind,name){
  var c=(kind==='arch'?CAP_ARCH:CAP_TRAIT)[name];
  return c===undefined?null:'limit '+c.toLocaleString();
}
function archOpen(name){var c=CAP_ARCH[name];return c===undefined||(state.cArch[name]||0)<c;}
function newKid(tier,forged){
  if(tier===5&&state.momMinted>=MOM_CAP) tier=4;
  var rng=rngFrom((state.uid*2654435761+Date.now())>>>0);
  var pool=[],i;
  for(i=0;i<TYPES.length;i++) if(TYPES[i].r===tier && archOpen(TYPES[i].name)) pool.push(i);
  if(!pool.length){ /* whole tier is capped out -- drop a rung */
    while(tier>0&&!pool.length){ tier--;
      for(i=0;i<TYPES.length;i++) if(TYPES[i].r===tier && archOpen(TYPES[i].name)) pool.push(i); }
  }
  var arch=pool[Math.floor(rng()*pool.length)];
  var gen=state.genMinted<GEN_CAP;
  var skinPool=[];
  for(i=0;i<SKINS.length;i++){ if(gen||SKINS[i].kind==='human') skinPool.push({i:i,n:SKINS[i].n}); }
  var sk=pickW(rng,skinPool,'n').i;
  var n=attrCountFor(rng);
  var idxs=[];for(i=0;i<SLOTS.length;i++)idxs.push(i);
  for(var j=idxs.length-1;j>0;j--){var q=Math.floor(rng()*(j+1));var tm=idxs[j];idxs[j]=idxs[q];idxs[q]=tm;}
  var attrs={};
  for(var m=0;m<n;m++){
    var sl=SLOTS[idxs[m]],val=pick(rng,sl.v),guard=0;
    while(CAP_TRAIT[val]!==undefined && (state.cTrait[val]||0)>=CAP_TRAIT[val] && guard++<20)
      val=pick(rng,sl.v);
    if(CAP_TRAIT[val]!==undefined && (state.cTrait[val]||0)>=CAP_TRAIT[val]) continue;
    attrs[sl.k]=val;
  }
  var lift=tier*13;
  var k={index:state.uid++,arch:arch,skin:sk,hairColor:Math.floor(rng()*HAIRCOLORS.length),
    hairStyle:Math.floor(rng()*HAIRSTYLES.length),attrs:attrs,attrCount:n,tier:tier,
    genesis:gen,forged:!!forged,
    id:String(Math.floor(rng()*9999)+1),
    air:Math.min(99,Math.floor(rng()*46)+12+lift),
    chaos:Math.min(99,Math.floor(rng()*46)+20+lift),
    grip:Math.max(1,Math.min(99,Math.floor(rng()*40)+4+(tier===5?40:0))),
    exit:Math.max(2,Math.min(99,Math.floor(rng()*39)+58-tier*11))};
  var mod=TYPES[arch].mod; if(mod){for(var mk in mod)k[mk]=mod[mk];}
  return k;
}
function registerMint(k){
  if(k.genesis)state.genMinted++;
  if(k.tier===5)state.momMinted++;
  var an=TYPES[k.arch].name; state.cArch[an]=(state.cArch[an]||0)+1;
  for(var si=0;si<SLOTS.length;si++){
    var v=k.attrs[SLOTS[si].k];
    if(v&&CAP_TRAIT[v]!==undefined) state.cTrait[v]=(state.cTrait[v]||0)+1;
  }
}

/* ---- physics ---- */
var play=document.getElementById('play'),actors=[],bounds={w:0,h:0};
function measure(){var r=play.getBoundingClientRect();bounds.w=r.width;bounds.h=r.height;}
window.addEventListener('resize',measure);
function sizeOf(){return Math.max(34,Math.min(60,bounds.w*0.085));}
function actorAt(s){for(var i=0;i<actors.length;i++)if(actors[i].slot===s)return actors[i];return null;}
function spawn(k,slot){
  var el=document.createElement('div');el.className='b';el.innerHTML=drawKid(k);
  play.appendChild(el);var sz=sizeOf();el.style.width=sz+'px';
  var lanes=[0.14,0.42,0.70];
  actors.push({el:el,slot:slot,x:bounds.w*lanes[slot],y:-sz*1.6,vx:rnd(-1.2,1.2),vy:0,
    w:sz,h:sz*1.3,leaving:false,rot:0,spin:0,op:1,squash:0});
  document.getElementById('emptynote').style.display='none';
}
function evict(slot){var a=actorAt(slot);if(!a)return;a.slot=-1;a.leaving=true;a.phase='wind';a.windT=60;a.vx=0;a.vy=0;a.y=bounds.h-a.h;a.flyT=0;}
function despawn(slot){var a=actorAt(slot);if(!a)return;a.slot=-1;a.leaving=true;a.phase='fly';a.flyT=40;a.vy=-3.2;a.vx=rnd(-0.8,0.8);a.spin=rnd(-2,2);}
var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function rnd(a,b){return a+Math.random()*(b-a);}
function tick(){
  if(bounds.w<=0){requestAnimationFrame(tick);return;}
  for(var i=actors.length-1;i>=0;i--){var a=actors[i];
    if(a.leaving){
      if(a.phase==='wind'){a.windT--;var k=1-(a.windT/60);var jit=Math.sin(a.windT*0.9)*2.2*k;
        a.el.style.transform='translate('+(a.x+jit).toFixed(1)+'px,'+a.y.toFixed(1)+'px) scale('+(1+0.3*k).toFixed(3)+','+(1-0.34*k).toFixed(3)+')';
        if(a.windT<=0){a.phase='fly';a.vy=-3.6;a.vx=rnd(0.35,0.95)*(Math.random()<0.5?-1:1);a.spin=rnd(1.4,2.8)*(a.vx<0?-1:1);}
        continue;}
      a.flyT++;a.vy+=0.014;a.y+=a.vy;a.x+=a.vx;a.rot+=a.spin;
      if(a.flyT>50){a.op-=0.011;if(a.op<0)a.op=0;}
      a.el.style.opacity=a.op;
      a.el.style.transform='translate('+a.x.toFixed(1)+'px,'+a.y.toFixed(1)+'px) rotate('+a.rot.toFixed(0)+'deg) scale('+(0.7+0.3*a.op).toFixed(2)+')';
      if(a.y<-a.h-70||a.op<=0){if(a.el.parentNode)a.el.parentNode.removeChild(a.el);actors.splice(i,1);}
      continue;}
    if(reduce){a.el.style.transform='translate('+a.x.toFixed(1)+'px,'+(bounds.h-a.h)+'px)';continue;}
    a.vy+=0.55;a.x+=a.vx;a.y+=a.vy;
    if(a.x<0){a.x=0;a.vx=Math.abs(a.vx)*0.9;}
    if(a.x>bounds.w-a.w){a.x=bounds.w-a.w;a.vx=-Math.abs(a.vx)*0.9;}
    if(a.y>bounds.h-a.h){a.y=bounds.h-a.h;a.vy=-Math.abs(a.vy)*0.84-rnd(4,9);a.vx+=rnd(-1,1);
      if(a.vx>3.4)a.vx=3.4;if(a.vx<-3.4)a.vx=-3.4;a.squash=1;}
    if(a.y<-a.h){a.y=-a.h;a.vy=1;}
    a.squash*=0.84;
    a.el.style.transform='translate('+a.x.toFixed(1)+'px,'+a.y.toFixed(1)+'px) rotate('+(a.vx*4).toFixed(1)+'deg) scale('+(1+a.squash*0.24).toFixed(3)+','+(1-a.squash*0.3).toFixed(3)+')';
  }
  requestAnimationFrame(tick);
}

/* ---- render ---- */
function renderPhase(){
  var ph=phase(),left=Math.max(0,GEN_CAP-state.genMinted),ml=Math.max(0,MOM_CAP-state.momMinted);
  var d=[['Genesis',left.toLocaleString()+' of 10,000 left'],
         ['Post-genesis',ml+' MOM remaining'],
         ['Blower off','No MOM will ever mint again']];
  var h='';for(var i=0;i<3;i++) h+='<div class="ph3'+(i===ph?' on':'')+'"><b>'+d[i][0]+'</b><span>'+d[i][1]+'</span></div>';
  document.getElementById('phasebar').innerHTML=h;
}
function renderOdds(){
  var B=state.burn,p=oddsFor(B),h='';
  for(var i=0;i<6;i++){
    h+='<div class="orow"><i>'+RAR[i].n+'</i><div class="obar"><u style="width:'+(p[i]*100).toFixed(1)+'%;background:'+RAR[i].c+'"></u></div><div class="oval">'+(p[i]*100).toFixed(2)+'%</div></div>';
  }
  document.getElementById('odds').innerHTML=h;
  document.getElementById('burnnum').textContent=B.toLocaleString();
}
function traitRows(k){
  var rows=[['Skin',SKINS[k.skin].id+' ('+SKINS[k.skin].n+'/10k)'],['Attributes',k.attrCount+' of 8']];
  for(var i=0;i<SLOTS.length;i++){
    var v=k.attrs[SLOTS[i].k]; if(!v) continue;
    var cn=capNote('trait',v);
    rows.push([SLOTS[i].k.replace(/([A-Z])/g,' $1')+(cn?' \u00b7 capped':''), v+(cn?' ('+cn+')':'')]);
  }
  return rows.map(function(r){return '<div class="tr"><span>'+r[0]+'</span><b>'+r[1]+'</b></div>';}).join('');
}
function renderCard(k){
  var r=RAR[k.tier];
  document.getElementById('reveal').innerHTML='<div class="bcard pop" style="--tint:'+r.c+'33">'
    +'<div class="art"><div class="rar mono" style="background:'+r.c+';color:'+(k.tier===4?'#16223B':'#fff')+'">'+r.n+'</div>'
    +'<div class="idn mono">#'+k.id+'</div>'+drawKid(k)+'</div>'
    +'<div class="meta"><h4>'+TYPES[k.arch].name+'</h4><div class="quip">"'+TYPES[k.arch].quip+'"</div>'
    +'<div class="stats"><div class="stat"><b>'+k.air+'</b><span>Air</span></div>'
    +'<div class="stat"><b>'+k.chaos+'</b><span>Chaos</span></div>'
    +'<div class="stat"><b>'+k.grip+'</b><span>Grip</span></div></div>'
    +'<div class="exitliq"><span class="mono">Exit liquidity</span><b>'+k.exit+'%</b></div>'
    +'<div class="tags">'+(k.genesis?'<span class="tag2 gen">Genesis</span>':'')+(k.forged?'<span class="tag2 frg">Forged</span>':'')
      +(capNote('arch',TYPES[k.arch].name)?'<span class="tag2 cap">'+capNote('arch',TYPES[k.arch].name)+'</span>':'')
      +cappedTraitTags(k)
      +'</div>'
    +'<div class="traits">'+traitRows(k)+'</div></div></div>';
  document.getElementById('cardacts').hidden=false;
  document.getElementById('keep').hidden=!!k.minted;
}
function flexText(k){
  return 'I pulled '+TYPES[k.arch].name+' (#'+k.id+') out of the Bounce House.\n'
    +RAR[k.tier].n+(k.genesis?' \u00b7 GENESIS':'')+(k.forged?' \u00b7 FORGED':'')+' \u00b7 '+SKINS[k.skin].id+' skin \u00b7 '+k.attrCount+'/8 attributes\n'
    +'Exit liquidity: '+k.exit+'%\n\n$BOUNCE \u2014 the floor is pumping.';
}
function renderTabs(){
  var h='';
  for(var i=0;i<3;i++){
    var k=state.slots[i],lab;
    if(!k) lab = (i<2 ? 'Free' : 'Needs burn');
    else lab = k.minted ? 'Minted' : TYPES[k.arch].name;
    h+='<button class="stab'+(i===state.sel?' on':'')+(k&&k.minted?' mint':'')+'" data-i="'+i+'">'
      +'<b>'+(i+1)+'</b><i>'+lab+'</i></button>';
  }
  var w=document.getElementById('slottabs');w.innerHTML=h;
  var bs=w.querySelectorAll('.stab');
  for(var q=0;q<bs.length;q++) bs[q].addEventListener('click',function(){
    selectSlot(+this.getAttribute('data-i'));});
}
function selectSlot(i){
  state.sel=i;
  if(state.slots[i]) renderCard(state.slots[i]);
  else{
    document.getElementById('cardacts').hidden=true;
    document.getElementById('reveal').innerHTML='<div class="slot"><div class="mono" style="font-size:11px">Slot '+(i+1)+' is empty</div><p class="ph">'+(i<2?'Free kid, base odds.':'Burn 100K or more to unlock this one.')+'</p></div>';
  }
  renderTabs();renderRoster();updateButton();save();
}
function renderRoster(){
  var h='';
  for(var i=0;i<3;i++){var k=state.slots[i];
    if(k) h+='<button class="rslot'+(i===state.sel?' on':'')+(k.minted?' lockd':'')+'" data-i="'+i+'" style="--tint:'+RAR[k.tier].c+'2E">'
      +(k.minted?'<div class="lockbadge mono">MINTED</div>':'')
      +'<div class="rart">'+drawKid(k)+'</div><div class="rn">'+TYPES[k.arch].name+'</div></button>';
    else h+='<button class="rslot empty" data-i="'+i+'"><span>+</span><div class="rn">Empty</div></button>';}
  var w=document.getElementById('roster');w.innerHTML=h;
  var bs=w.querySelectorAll('.rslot');
  for(var q=0;q<bs.length;q++)bs[q].addEventListener('click',function(){
    selectSlot(+this.getAttribute('data-i'));});
}
function renderVault(){
  var w=document.getElementById('coll'),h='',g=0,f=0,v=mintedKids();
  for(var i=v.length-1;i>=0;i--){var k=v[i];
    if(k.genesis)g++; if(k.forged)f++;
    h+='<div class="slotmini" style="--tint:'+RAR[k.tier].c+'2E" title="'+TYPES[k.arch].name+'">'+drawKid(k)+'<div class="n">'+TYPES[k.arch].name+'</div></div>';}
  w.innerHTML=h||'<div style="color:var(--ink-soft);font-size:14px">Nothing kept yet. Roll someone, then hit keep.</div>';
  document.getElementById('occn').textContent=v.length;
  document.getElementById('genn').textContent=g;
  document.getElementById('forgen').textContent=f;
}
function renderForge(){
  var counts=[0,0,0,0,0,0],i,v=mintedKids();
  for(i=0;i<v.length;i++) counts[v[i].tier]++;
  var h='';
  for(var t=0;t<4;t++){
    var f=FORGE[t],ok=counts[t]>=f.need;
    var top=f.p.slice().map(function(v,idx){return {v:v,i:idx};}).sort(function(a,b){return b.v-a.v;})[0];
    h+='<div class="fcard"><h4>'+f.need+' '+RAR[t].n.toLowerCase()+'s</h4>'
      +'<div class="fsub">you have '+counts[t]+'</div>'
      +'<div class="fodds">Most likely <b>'+RAR[top.i].n+'</b> at <b>'+top.v+'%</b><br>Mythic stays at <b>'+f.p[5]+'%</b></div>'
      +'<button class="btn'+(ok?'':' ghost')+'" data-t="'+t+'"'+(ok?'':' disabled')+'>'+(ok?'Forge':(f.need>3?'Needs secondary market':'Need '+(f.need-counts[t])+' more'))+'</button></div>';
  }
  var w=document.getElementById('forgerow');w.innerHTML=h;
  var bs=w.querySelectorAll('button[data-t]');
  for(i=0;i<bs.length;i++) bs[i].addEventListener('click',function(){doForge(+this.getAttribute('data-t'));});
}

/* ---- cooldown / button ---- */
var COOL=0,ct=null;
function startCool(ms){ if(!ms){COOL=0;updateButton();return;}
  COOL=Date.now()+ms; if(ct)clearInterval(ct);
  ct=setInterval(function(){if(Date.now()>=COOL){clearInterval(ct);ct=null;}updateButton();},200);
  updateButton();}
function firstEmpty(){for(var i=0;i<3;i++)if(!state.slots[i])return i;return -1;}
function updateButton(){
  var p=document.getElementById('pull'),pf=document.getElementById('pullfree'),
      hint=document.getElementById('rhint'),note=document.getElementById('pnote');
  if(!state.signed){
    p.disabled=false;p.textContent='\u2191 Sign the waiver first';pf.hidden=true;
    note.textContent='Tap to jump up to it';return;}
  var left=COOL-Date.now();
  if(left>0){
    p.disabled=true;p.textContent='Blower recharging \u2014 '+(left/1000).toFixed(1)+'s';
    pf.hidden=true;note.textContent='Burn more to cut the wait';return;}
  p.disabled=false;
  var sel=state.sel, cur=state.slots[sel];
  if(cur&&cur.minted){
    p.disabled=true;p.textContent='Slot '+(sel+1)+' is minted';pf.hidden=true;
    hint.textContent=TYPES[cur.arch].name+' is locked';
    note.textContent='Minted kids can never be rerolled. Pick another slot.';
    return;
  }
  if(!cur){
    pf.hidden=true;
    if(sel<2){p.textContent='Take a free kid \u00b7 slot '+(sel+1);note.textContent='No burn. Base odds \u2014 MOM at 0.40%';}
    else if(state.burn<SLOT3_MIN){
      p.disabled=true;
      p.textContent='Slot 3 needs 100K minimum';
      note.textContent='Turn the blower up \u2014 you are at '+fmtB(state.burn);
    }
    else{p.textContent='Burn '+fmtB(state.burn)+' \u00b7 unlock slot 3';note.textContent='100K minimum. More air, better odds.';}
    hint.textContent='Slot '+(sel+1)+' is empty';
    return;
  }
  var k=cur,fr=state.free[sel];
  p.textContent='Burn '+fmtB(state.burn)+' \u00b7 reroll slot '+(sel+1);
  pf.hidden = fr<=0;
  pf.textContent='Free reroll \u00b7 '+fr+' left on slot '+(sel+1);
  hint.textContent=(k?TYPES[k.arch].name:'Someone')+' gets the boot';
  var cd=cooldownFor(state.rerolls,state.burn),m=oddsFor(state.burn)[5]*100;
  note.textContent=(fr>0?'Free = base odds (0.40% MOM). ':'')+'Burn = '+m.toFixed(2)+'% MOM'+(cd?', '+(cd/1000).toFixed(1)+'s wait':', no wait');
}
function toast(m){var t=document.getElementById('toast');t.textContent=m;t.classList.add('show');
  clearTimeout(t._t);t._t=setTimeout(function(){t.classList.remove('show');},2600);}

/* ---- actions ---- */
var outageDone=0;
function maybeOutage(){
  /* rare, short, costs you nothing. it just happens. */
  if(reduce||outageDone>=2||Math.random()>0.035) return false;
  outageDone++;
  var st=document.getElementById('stage');
  st.classList.add('out');
  toast('The blower stopped. Nobody knows why.');
  setTimeout(function(){
    st.classList.remove('out');
    toast('Back up. Nothing was lost. Probably.');
  },3400);
  return true;
}
function doRoll(useFree){
  var target=state.sel,cur=state.slots[target];
  if(cur&&cur.minted)return;
  if(!cur&&target===2&&state.burn<SLOT3_MIN){toast('Slot 3 needs at least 100,000 BOUNCE.');return;}
  var reroll=!!cur,out=null,usedFree=false;
  if(reroll){
    out=cur;
    if(useFree&&state.free[target]>0){state.free[target]--;usedFree=true;}
    else state.rerolls++;
    evict(target);
  } else {
    usedFree = (target<2);   /* slots 1 and 2 are free at base odds */
  }
  /* a free roll never gets burn-boosted odds */
  var k=newKid(pickTier(oddsFor(usedFree?100000:state.burn)),false);
  state.slots[target]=k;state.sel=target;
  var btn=document.getElementById('pull');
  if(reroll){
    btn.disabled=true;
    toast((out?TYPES[out.arch].name:'Someone')+' is being asked to leave\u2026');
    setTimeout(function(){spawn(k,target);},4000);
    setTimeout(function(){renderCard(k);renderTabs();renderRoster();updateButton();
      toast((out?TYPES[out.arch].name:'They')+' went out the roof.');
      startCool(usedFree?0:cooldownFor(state.rerolls,state.burn));},4000);
  }else{maybeOutage();spawn(k,target);renderCard(k);renderTabs();renderRoster();updateButton();
    if(k.tier>=4)toast(k.tier===5?"MOM. Party's over.":'Legendary.');}
  save();
}
function doKeep(){
  var k=state.slots[state.sel];if(!k||k.minted)return;
  k.minted=true;registerMint(k);
  renderCard(k);renderTabs();renderRoster();renderVault();renderForge();renderPhase();updateButton();save();
  toast(TYPES[k.arch].name+' minted. That slot is locked for good.');
}
function mintedKids(){var o=[];for(var i=0;i<3;i++)if(state.slots[i]&&state.slots[i].minted)o.push(state.slots[i]);return o;}
function doForge(t){
  var f=FORGE[t],taken=[],i;
  for(i=0;i<3&&taken.length<f.need;i++) if(state.slots[i]&&state.slots[i].minted&&state.slots[i].tier===t) taken.push(i);
  if(taken.length<f.need)return;
  for(i=0;i<taken.length;i++){ despawn(taken[i]); state.slots[taken[i]]=null; state.free[taken[i]]=3; }
  var pr=f.p.map(function(v){return v/100;});
  var k=newKid(pickTier(pr),true); k.minted=true;
  registerMint(k); state.slots[taken[0]]=k; state.sel=taken[0];
  setTimeout(function(){spawn(k,taken[0]);},700);
  renderTabs();renderRoster();renderVault();renderForge();renderPhase();renderCard(k);save();
  toast('Forged '+f.need+' '+RAR[t].n.toLowerCase()+'s \u2192 '+RAR[k.tier].n);
  document.getElementById('pulls').scrollIntoView({behavior:reduce?'auto':'smooth'});
}

/* ---- wiring ---- */
document.getElementById('burn').addEventListener('input',function(e){
  state.burn=sliderToBurn(+e.target.value);renderOdds();updateButton();});
document.getElementById('agree').addEventListener('change',function(e){
  document.getElementById('enter').disabled=!e.target.checked;});
function lockWaiver(){
  var a=document.getElementById('agree'),e=document.getElementById('enter'),
      w=document.getElementById('waiver');
  a.checked=true;a.disabled=true;
  e.disabled=true;e.textContent='Shoes are off';e.classList.add('ghost');
  w.querySelector('.sign').classList.add('signed');
}
document.getElementById('enter').addEventListener('click',function(){
  if(state.signed)return;
  state.signed=true;save();lockWaiver();updateButton();
  document.getElementById('pulls').scrollIntoView({behavior:reduce?'auto':'smooth'});});
document.getElementById('pull').addEventListener('click',function(){
  if(!state.signed){gotoWaiver();return;}
  doRoll(false);});
function gotoWaiver(){
  var sec=document.getElementById('waiver');
  sec.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});
  var card=sec.querySelector('.card');
  card.classList.remove('flash');void card.offsetWidth;card.classList.add('flash');
  setTimeout(function(){var a=document.getElementById('agree');if(a)a.focus({preventScroll:true});},650);
}
document.getElementById('pullfree').addEventListener('click',function(){doRoll(true);});
document.getElementById('keep').addEventListener('click',doKeep);
document.getElementById('tox').addEventListener('click',function(){
  var k=state.slots[state.sel];if(!k)return;
  var t=flexText(k);
  copy(t,'Copied \u2014 opening X\u2026');
  window.open('https://x.com/intent/post?text='+encodeURIComponent(t),'_blank','noopener');});
document.getElementById('copyca').addEventListener('click',function(){
  copy(document.getElementById('ca').textContent.trim(),'Contract copied.');});
function copy(t,ok){if(navigator.clipboard&&navigator.clipboard.writeText)
  navigator.clipboard.writeText(t).then(function(){toast(ok);},function(){fb(t,ok);});else fb(t,ok);}
function fb(t,ok){var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';
  document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy');toast(ok);}catch(e){toast('Select the text above and copy.');}
  document.body.removeChild(ta);}

/* ---------- the kids page ---------- */
function sampleKid(o,seed){
  var rng=rngFrom(seed>>>0);
  var k={index:seed,arch:0,skin:0,hairColor:Math.floor(rng()*HAIRCOLORS.length),
         hairStyle:Math.floor(rng()*HAIRSTYLES.length),attrs:{},attrCount:0,tier:0};
  for(var q in o) k[q]=o[q];
  k.attrCount=Object.keys(k.attrs).length;
  k.tier=TYPES[k.arch].r;
  return k;
}
function skinBand(n){return n>=400?'#8FA3B8':n>=150?'#3FBF5C':n>=60?'#1F5EF5':n>=30?'#8A4FE0':n>=5?'#FFC61E':'#F0402F';}
function gcard(k,tint,name,sub){
  return '<figure class="gc" style="--gt:'+tint+'"><div class="gart">'+drawKid(k)+'</div>'
    +'<figcaption><b>'+name+'</b><span>'+sub+'</span></figcaption></figure>';
}
var kidsBuilt=false;
function buildKids(){
  if(kidsBuilt)return; kidsBuilt=true;
  var h='',i,j;

  h+='<div class="gsec"><h3>The eleven skins</h3><div class="gk">tinted by scarcity \u2014 grey common, gold 9 of 10,000, red one of one</div><div class="ggrid">';
  for(i=0;i<SKINS.length;i++){
    var sk=SKINS[i];
    h+=gcard(sampleKid({skin:i,arch:0,attrs:{}},1000+i*77), skinBand(sk.n), sk.id.toUpperCase(), sk.n.toLocaleString()+' of 10,000');
  }
  h+='</div></div>';

  h+='<div class="gsec"><h3>The eighteen archetypes</h3><div class="gk">pose is the locked signature \u2014 everything else floats</div><div class="ggrid">';
  for(i=0;i<TYPES.length;i++){
    var cn=capNote('arch',TYPES[i].name);
    h+=gcard(sampleKid({arch:i,skin:i%6,attrs:{}},2000+i*131), RAR[TYPES[i].r].c+'33', TYPES[i].name,
             RAR[TYPES[i].r].n+(cn?' \u00b7 '+cn:''));
  }
  h+='</div></div>';

  h+='<div class="gsec"><h3>The eight attribute slots</h3><div class="gk">a kid carries anywhere from zero to all eight</div>';
  for(i=0;i<SLOTS.length;i++){
    var sl=SLOTS[i], label=sl.k.replace(/([A-Z])/g,' $1');
    h+='<div class="slotgrp"><h4>'+label.charAt(0).toUpperCase()+label.slice(1)+'</h4><p>'+sl.v.length+' possible</p><div class="ggrid">';
    for(j=0;j<sl.v.length;j++){
      var a={}; a[sl.k]=sl.v[j];
      var tc=capNote('trait',sl.v[j]);
      h+=gcard(sampleKid({arch:0,skin:1,attrs:a},3000+i*97+j*13), tc?'#F0402F33':'#E7ECF3', sl.v[j],
               tc?tc:label);
    }
    h+='</div></div>';
  }
  h+='</div>';

  h+='<div class="gsec"><h3>How many attributes</h3><div class="gk">bimodal \u2014 almost none and almost all are both rare. eight kids wear nothing at all, and exactly one wears everything. if those numbers seem familiar, they should</div><div class="ggrid">';
  var keys=Object.keys(ATTR_DIST).sort(function(a,b){return a-b;});
  for(i=0;i<keys.length;i++){
    var n=+keys[i], at={}, idx=0;
    for(j=0;j<n;j++){ at[SLOTS[j].k]=SLOTS[j].v[(j+n)%SLOTS[j].v.length]; }
    h+=gcard(sampleKid({arch:0,skin:2,attrs:at},4000+n*211), n>=7||n===0?'#F0402F33':'#E7ECF3', n+(n===1?' attribute':' attributes'), ATTR_DIST[n].toLocaleString()+' of 10,000');
  }
  h+='</div></div>';

  var caps=[];
  for(var ci=0;ci<TYPES.length;ci++){var cn2=capNote('arch',TYPES[ci].name);
    if(cn2) caps.push([sampleKid({arch:ci,skin:ci%6,attrs:{}},5000+ci*57), TYPES[ci].name, cn2, RAR[TYPES[ci].r].c+'33']);}
  for(var sj=0;sj<SLOTS.length;sj++){
    for(var si=0;si<SLOTS[sj].v.length;si++){
      var cn3=capNote('trait',SLOTS[sj].v[si]);
      if(!cn3) continue;
      var aa={}; aa[SLOTS[sj].k]=SLOTS[sj].v[si];
      caps.push([sampleKid({arch:0,skin:2,attrs:aa},6000+sj*211+si*41), SLOTS[sj].v[si], cn3, '#F0402F33']);
    }
  }
  caps.push([sampleKid({skin:SKINS.length-1,arch:0,attrs:{}},6100), 'Deflated', 'limit 1', '#F0402F33']);
  caps.push([sampleKid({skin:SKINS.length-2,arch:0,attrs:{}},6200), 'Alien', 'genesis limit 9', '#FFC61E33']);
  var ch='<div class="gsec"><h3>Capped forever</h3><div class="gk">once these run out the contract will never mint another</div><div class="ggrid">';
  for(var q=0;q<caps.length;q++) ch+=gcard(caps[q][0],caps[q][3],caps[q][1],caps[q][2]);
  ch+='</div></div>';
  document.getElementById('kidsbody').innerHTML=ch+h;
}
(function(){
  var tabs=document.querySelectorAll('.tab');
  for(var i=0;i<tabs.length;i++) tabs[i].addEventListener('click',function(){
    var pg=this.getAttribute('data-p');
    for(var j=0;j<tabs.length;j++) tabs[j].classList.toggle('on',tabs[j]===this);
    document.getElementById('page-house').hidden = (pg!=='house');
    document.getElementById('page-kids').hidden  = (pg!=='kids');
    if(pg==='kids') buildKids(); else setTimeout(measure,30);
    window.scrollTo(0,0);
  });
})();

document.addEventListener('contextmenu',function(e){
  if(e.target.closest && e.target.closest('.bcard, .rslot, .gc, .play'))
    toast('Go ahead. Right-click and save it. It is an SVG.');
});

document.getElementById('reset').addEventListener('click',function(e){
  e.preventDefault();
  Store.set('bounce:v4','').then(function(){ location.reload(); });
});

(function(){var h='';for(var i=0;i<RULES.length;i++)
  h+='<div class="rule"><div class="no mono">Rule '+String(i+1).padStart(2,'0')+'</div><h4>'+RULES[i].h+'</h4><p>'+RULES[i].p+'</p></div>';
  document.getElementById('ruleswrap').innerHTML=h;})();

measure();window.addEventListener('load',measure);setTimeout(measure,600);
renderPhase();renderOdds();renderTabs();renderRoster();renderVault();renderForge();updateButton();
requestAnimationFrame(tick);

Store.get('bounce:v4').then(function(raw){
  if(!raw)return;var d;try{d=JSON.parse(raw);}catch(e){return;}
  if(!d||!d.slots)return;
  for(var kk in d) state[kk]=d[kk];
  document.getElementById('burn').value=Math.round((Math.log(state.burn)/Math.LN10-4)/3*1000);
  renderPhase();renderOdds();renderTabs();renderRoster();renderVault();renderForge();updateButton();
  if(state.signed) lockWaiver();
  if(state.slots[state.sel])renderCard(state.slots[state.sel]);
  setTimeout(function(){for(var i=0;i<3;i++) if(state.slots[i]) spawn(state.slots[i],i);},150);
}).catch(function(){});
