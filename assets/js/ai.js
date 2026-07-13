// ═══════════════════════════════════════
// GEMINI AI
// ═══════════════════════════════════════
function toggleAI(){document.getElementById('aip').classList.toggle('open')}
function aiQ(q){document.getElementById('ai-inp').value=q;sendAI()}
async function sendAI(){
  const inp=document.getElementById('ai-inp');const q=inp.value.trim();if(!q)return;
  inp.value='';addAIMsg(q,'user');
  const thinking=addAIMsg('ভাবছি…','thinking');
  const tS=accounts.reduce((s,a)=>s+a.spend,0);const tP=accounts.reduce((s,a)=>s+a.purchases,0);
  const wCPP=tP>0?tS/tP:0;const tSR=accounts.filter(a=>a.roas>0).reduce((s,a)=>s+a.spend,0);
  const wROAS=tSR>0?accounts.filter(a=>a.roas>0).reduce((s,a)=>s+(a.spend*a.roas),0)/tSR:0;
  const maxCPP=pf(document.getElementById('tc')?.value)||5;const minROAS=pf(document.getElementById('troas')?.value)||2;
  const topC=campaigns.filter(c=>c.spend>0).sort((a,b)=>b.spend-a.spend).slice(0,10);
  const badC=campaigns.filter(c=>c.purchases>0&&(c.cpp>maxCPP||c.roas<minROAS)&&c.status==='ACTIVE');
  const goodC=campaigns.filter(c=>c.purchases>0&&c.cpp<=maxCPP&&c.roas>=minROAS&&c.status==='ACTIVE');
  const prompt=`তুমি Alzeena Ads-এর AI সহকারী এবং Meta Ads বিশেষজ্ঞ। বাংলায় উত্তর দাও।

## Real-time data (${rangeLbl})
- Accounts: ${accounts.length}, Active campaigns: ${campaigns.filter(c=>c.status==='ACTIVE').length}/${campaigns.length}
- Total spend: ${mn(tS)}, Total purchases: ${tP}
- Weighted CPP: ${wCPP>0?mn(wCPP):'N/A'}, Weighted ROAS: ${wROAS>0?wROAS.toFixed(2)+'x':'N/A'}
- Target: CPP ≤ ${mn(maxCPP)}, ROAS ≥ ${minROAS}x
- Good campaigns: ${goodC.length}, Needs attention: ${badC.length}

## Top campaigns:
${topC.map(c=>`• ${c.name} (${c.accountName}): spend=${mn(c.spend)}, purchases=${c.purchases}, CPP=${mn(c.cpp)}, ROAS=${c.roas.toFixed(2)}x`).join('\n')}
${badC.length?'\n## Problematic:\n'+badC.slice(0,5).map(c=>`• ${c.name}: CPP=${mn(c.cpp)}, ROAS=${c.roas.toFixed(2)}x`).join('\n'):''}

প্রশ্ন: ${q}`;
  const reply=await gemini(prompt);thinking.remove();
  addAIMsg(reply||'উত্তর পাওয়া যায়নি।','ai');
}
function addAIMsg(text,type){
  const body=document.getElementById('aip-body');const d=document.createElement('div');d.className='aim '+type;
  if(type==='ai'){d.innerHTML=text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/^## (.*)/gm,'<div style="font-weight:700;font-size:12px;color:var(--pritx);margin:6px 0 3px">$1</div>').replace(/^[•\-] /gm,'<span style="color:var(--pri);margin-right:4px">•</span>').replace(/\n/g,'<br>');}
  else d.textContent=text;
  body.appendChild(d);body.scrollTop=body.scrollHeight;return d;
}
async function gemini(prompt) {
  try {
    const r = await fetch("/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await r.json();

    if (!r.ok) {
      showToast("Gemini error: " + (data.error || "Unknown error"), "d");
      return null;
    }

    return data.text || null;
  } catch (e) {
    showToast("Gemini error: " + e.message, "d");
    return null;
  }
}

// ═══════════════════════════════════════
// AI DAILY SUMMARY
// ═══════════════════════════════════════
async function genDailySummary(){
  const btn=document.getElementById('sum-btn');btn.disabled=true;btn.textContent='⏳ Generating…';
  const wrap=document.getElementById('sum-wrap');const body=document.getElementById('sum-body');
  wrap.classList.remove('hidden');body.innerHTML='<div class="spin" style="margin:8px auto"></div>';
  const tS=accounts.reduce((s,a)=>s+a.spend,0);const tP=accounts.reduce((s,a)=>s+a.purchases,0);
  const wCPP=tP>0?tS/tP:0;const tSR=accounts.filter(a=>a.roas>0).reduce((s,a)=>s+a.spend,0);
  const wROAS=tSR>0?accounts.filter(a=>a.roas>0).reduce((s,a)=>s+(a.spend*a.roas),0)/tSR:0;
  const maxCPP=pf(document.getElementById('tc')?.value)||5;const minROAS=pf(document.getElementById('troas')?.value)||2;
  const goodC=campaigns.filter(c=>c.purchases>0&&c.cpp<=maxCPP&&c.roas>=minROAS);
  const badC=campaigns.filter(c=>c.purchases>0&&(c.cpp>maxCPP||c.roas<minROAS));
  const top3=campaigns.filter(c=>c.purchases>0).sort((a,b)=>b.purchases-a.purchases).slice(0,3);
  const prompt=`তুমি Alzeena Ads-এর AI analyst। নিচের data দেখে একটি concise daily summary তৈরি করো।

## Data (${rangeLbl})
- Total spend: ${mn(tS)}, Purchases: ${tP}
- CPP: ${wCPP>0?mn(wCPP):'N/A'}, ROAS: ${wROAS>0?wROAS.toFixed(2)+'x':'N/A'}
- Good campaigns: ${goodC.length}, Needs attention: ${badC.length}
- Top 3 by purchases: ${top3.map(c=>`${c.name} (${c.purchases} purchases, ROAS ${c.roas.toFixed(2)}x)`).join(', ')}
${badC.length?'- Problematic: '+badC.slice(0,3).map(c=>c.name).join(', '):''}

একটি executive summary লিখো (৫-৭ lines, বাংলায়):
1. আজকের performance কেমন ছিল (overall)
2. কোন campaigns ভালো করছে এবং কেন
3. কোন campaigns-এ attention দরকার
4. আগামীকালের জন্য ১-২টা actionable recommendation`;
  const reply=await gemini(prompt);
  btn.disabled=false;btn.textContent='✨ AI Summary';
  if(!reply){body.innerHTML='<div style="color:var(--red-tx)">Error: Gemini key set করো</div>';return}
  body.innerHTML=reply.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
}

// ═══════════════════════════════════════
// BUDGET RECOMMENDATIONS
// ═══════════════════════════════════════
async function genRecs(){
  const btn=document.getElementById('rec-btn');const list=document.getElementById('rec-list');
  btn.disabled=true;btn.textContent='⏳ Analysing…';
  list.innerHTML='<div class="ltd"><div class="spin"></div>Gemini analyse করছে…</div>';
  const maxCPP=pf(document.getElementById('tc')?.value)||5;const minROAS=pf(document.getElementById('troas')?.value)||2;
  const data=campaigns.filter(c=>c.spend>0).map(c=>`"${c.name}" | ${c.status} | spend:${mn(c.spend)} | budget:$${c.daily_budget||0}/day | purchases:${c.purchases} | CPP:${mn(c.cpp)} | ROAS:${c.roas.toFixed(2)}x`).join('\n');
  const prompt=`Meta Ads campaign data দেখে budget recommendation দাও। ONLY JSON array:\n[{"name":"campaign","action":"increase|decrease|maintain","reason":"কারণ","priority":"high|medium|low"}]\n\nTarget: CPP ≤ ${mn(maxCPP)}, ROAS ≥ ${minROAS}x\n${data.slice(0,3000)}`;
  const reply=await gemini(prompt);btn.disabled=false;btn.textContent='✨ Analyse';
  let recs=[];
  if(reply){try{const m=reply.match(/\[[\s\S]*\]/);if(m)recs=JSON.parse(m[0])}catch(e){}}
  if(!recs.length){
    campaigns.filter(c=>c.spend>0).forEach(c=>{
      if(c.roas>=minROAS&&c.cpp<=maxCPP)recs.push({name:c.name,action:'increase',reason:`ROAS ${c.roas.toFixed(1)}x ভালো, CPP target-এর মধ্যে`,priority:'high'});
      else if(c.purchases===0&&c.spend>5)recs.push({name:c.name,action:'decrease',reason:`$${c.spend.toFixed(2)} খরচ, কোনো purchase নেই`,priority:'high'});
      else if(c.cpp>maxCPP*2)recs.push({name:c.name,action:'decrease',reason:`CPP ${mn(c.cpp)} — ${Math.round(c.cpp/maxCPP)}x above target`,priority:'medium'});
    });
  }
  if(!recs.length){list.innerHTML='<div class="ltd">No recommendations</div>';return}
  list.innerHTML=recs.slice(0,10).map(r=>{const isUp=r.action==='increase',isDn=r.action==='decrease';return`<div class="ri ${isDn?'dn':r.action==='maintain'?'ho':''}"><div style="font-size:16px">${isUp?'↑':isDn?'↓':'→'}</div><div style="flex:1;min-width:0"><div class="rn">${esc(r.name)}</div><div class="rr">${esc(r.reason||'')}</div></div><div class="ract ${isUp?'rup':isDn?'rdn':'rho'}">${isUp?'Budget বাড়াও':isDn?'কমাও':'Hold'}</div></div>`}).join('');
}

function loadBadDayProtection(){
  try{
    const saved=JSON.parse(localStorage.getItem('mads_bad_day')||'{}');
    badDayCfg={...badDayCfg,...saved};
  }catch(e){}
  const en=document.getElementById('bdp-enabled');
  const sp=document.getElementById('bdp-spend');
  const ap=document.getElementById('bdp-autopause');
  if(en)en.checked=!!badDayCfg.enabled;
  if(sp)sp.value=badDayCfg.spend||10;
  if(ap)ap.checked=!!badDayCfg.autoPause;
}
function saveBadDayProtection(){
  badDayCfg={
    enabled:!!document.getElementById('bdp-enabled')?.checked,
    spend:pf(document.getElementById('bdp-spend')?.value)||10,
    autoPause:!!document.getElementById('bdp-autopause')?.checked
  };
  localStorage.setItem('mads_bad_day',JSON.stringify(badDayCfg));
  renderBadDayList(getBadDayHits());
  showToast('✓ Bad day protection saved','i',badDayCfg.enabled?`Threshold ${mn(badDayCfg.spend)} · ${badDayCfg.autoPause?'auto pause on':'alert only'}`:'Protection disabled');
}
function getBadDayHits(){
  return campaigns.filter(c=>c.status==='ACTIVE'&&c.spend>=badDayCfg.spend&&c.purchases===0);
}
function renderBadDayList(hits){
  const box=document.getElementById('bdp-list');if(!box)return;
  if(!badDayCfg.enabled){box.innerHTML='<div style="font-size:12px;color:var(--txm)">Protection is currently off.</div>';return;}
  if(!hits.length){box.innerHTML='<div style="font-size:12px;color:var(--green)">✓ No active campaign matched your bad day rule.</div>';return;}
  box.innerHTML=hits.slice(0,10).map(c=>`<div class="ri dn" style="margin-bottom:8px"><div style="font-size:16px">⚠</div><div style="flex:1;min-width:0"><div class="rn">${esc(c.name)}</div><div class="rr">Spend ${mn(c.spend)} with 0 purchase</div></div><div class="ract rdn">${badDayCfg.autoPause?'Auto pause':'Alert'}</div></div>`).join('');
}
async function checkBadDayProtection(){
  renderBadDayList(getBadDayHits());
  if(!badDayCfg.enabled)return;
  const hits=getBadDayHits();
  if(!hits.length)return;
  hits.slice(0,3).forEach(c=>showToast(`🛡 Bad day: ${c.name}`,'w',`Spend ${mn(c.spend)} with no purchase`));
  if(badDayCfg.autoPause){
    let paused=0;
    for(const c of hits){
      try{
        const res=await fetch(`${API}/${c.id}?access_token=${token}`,{method:'POST',body:new URLSearchParams({status:'PAUSED'}),headers:{'Content-Type':'application/x-www-form-urlencoded'}});
        const d=await res.json();
        if(!d.error)paused++;
      }catch(e){}
    }
    if(paused)showToast('✓ Bad day protection paused campaigns','i',`${paused} campaign paused automatically`);
  }
}
function buildKillScaleSuggestions(){
  const maxCPP=pf(document.getElementById('tc')?.value)||5;
  const minROAS=pf(document.getElementById('troas')?.value)||2;
  const out=[];
  campaigns.filter(c=>c.status==='ACTIVE'&&c.spend>0).forEach(c=>{
    if(c.purchases===0&&c.spend>=badDayCfg.spend){
      out.push({name:c.name,action:'kill',reason:`Spent ${mn(c.spend)} with 0 purchase`,detail:'Pause immediately',priority:3});
      return;
    }
    if(c.purchases>0&&c.cpp<=maxCPP&&c.roas>=minROAS){
      const bump=c.roas>=minROAS*1.5?'+30% budget':'+20% budget';
      out.push({name:c.name,action:'scale',reason:`CPP ${mn(c.cpp)} and ROAS ${c.roas.toFixed(2)}x are inside target`,detail:bump,priority:2});
      return;
    }
    if(c.purchases>0&&(c.cpp>maxCPP*1.6||(c.roas>0&&c.roas<minROAS*0.75))){
      out.push({name:c.name,action:'kill',reason:`CPP ${mn(c.cpp)} / ROAS ${c.roas.toFixed(2)}x are too weak`,detail:'Pause or replace creative',priority:3});
      return;
    }
    const health=getCampaignHealth(c);
    out.push({name:c.name,action:'hold',reason:`Health score ${health.score} — gather more data or test a new creative`,detail:'Hold & test',priority:1});
  });
  return out.sort((a,b)=>b.priority-a.priority).slice(0,12);
}
function genKillScale(){
  const list=document.getElementById('ks-list');
  const btn=document.getElementById('ks-btn');
  if(!list)return;
  btn.disabled=true;btn.textContent='⏳ Analysing…';
  const items=buildKillScaleSuggestions();
  btn.disabled=false;btn.textContent='✨ Suggest';
  if(!items.length){list.innerHTML='<div class="ltd" style="padding:20px">No active campaigns to analyse</div>';return;}
  list.innerHTML=items.map(r=>{const isScale=r.action==='scale',isKill=r.action==='kill';return `<div class="ri ${isKill?'dn':isScale?'':'ho'}"><div style="font-size:16px">${isScale?'📈':isKill?'⛔':'🧪'}</div><div style="flex:1;min-width:0"><div class="rn">${esc(r.name)}</div><div class="rr">${esc(r.reason)}</div></div><div class="ract ${isScale?'rup':isKill?'rdn':'rho'}">${esc(r.detail)}</div></div>`}).join('');
}
