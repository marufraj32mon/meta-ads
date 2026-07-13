// ═══════════════════════════════════════
// SIMPLE BAR CHARTS
// ═══════════════════════════════════════
function renderAcctChart(){
  const sorted=[...accounts].filter(a=>a.spend>0).sort((a,b)=>b.spend-a.spend);
  document.getElementById('acnt-chart').style.display=sorted.length?'':'none';if(!sorted.length)return;
  const mx=sorted[0].spend;
  document.getElementById('acnt-bars').innerHTML=sorted.map((a,i)=>`<div class="brow"><div class="bn" title="${esc(a.name)}">${esc(a.name)}</div><div class="bt"><div class="bf" style="width:${Math.round(a.spend/mx*100)}%;background:${COLS[i%COLS.length]}"></div></div><div class="bv">${mn(a.spend,a.currency)}</div></div>`).join('');
}
function renderCampChart(){
  const sorted=[...campaigns].filter(c=>c.spend>0).sort((a,b)=>(b[cSort.f]||0)-(a[cSort.f]||0)).slice(0,15);
  document.getElementById('camp-chart').style.display=sorted.length?'':'none';if(!sorted.length)return;
  const field=cSort.f;const mx=Math.max(...sorted.map(c=>c[field]||0),1);
  document.getElementById('camp-bars').innerHTML=sorted.map((c,i)=>`<div class="brow"><div class="bn" title="${esc(c.name)}">${esc(c.name)}</div><div class="bt"><div class="bf" style="width:${Math.round((c[field]||0)/mx*100)}%;background:${COLS[i%COLS.length]}"></div></div><div class="bv">${field==='spend'?mn(c.spend,c.currency):c[field]}</div></div>`).join('');
}

// ═══════════════════════════════════════
// CREATIVES — WINNING DETECTOR
// ═══════════════════════════════════════
async function detectWin(){
  const btns=[document.getElementById('win-btn')].filter(Boolean);
  btns.forEach(b=>{if(b){b.disabled=true;b.textContent='⏳ Fetching…'}});
  const lists=['win-list'].map(id=>document.getElementById(id)).filter(Boolean);
  lists.forEach(el=>el.innerHTML='<div class="ltd"><div class="spin"></div>Ad-level data fetch করছে…</div>');
  const top=[...campaigns].filter(c=>c.status==='ACTIVE'&&c.spend>0).sort((a,b)=>b.spend-a.spend).slice(0,5);
  let allAds=[];const dp=dpParams();
  for(const camp of top){
    try{
      const r=await apiFetch('/'+camp.accountId+'/insights',{fields:'ad_id,ad_name,spend,impressions,actions,cost_per_action_type,purchase_roas,ctr',level:'ad',filtering:`[{"field":"campaign.id","operator":"IN","value":["${camp.id}"]}]`,limit:50,...dp});
      (r.data||[]).forEach(d=>{const pa=fA(d.actions);const ca=fA(d.cost_per_action_type);allAds.push({id:d.ad_id,name:d.ad_name||'Ad',campaign:camp.name,spend:pf(d.spend),impressions:pi(d.impressions),purchases:pa?pi(pa.value):0,cpp:ca?pf(ca.value):0,roas:d.purchase_roas?pf(d.purchase_roas[0]?.value):0,ctr:pf(d.ctr)})});
    }catch(e){}
  }
  btns.forEach(b=>{if(b){b.disabled=false;b.textContent='✨ Detect'}});
  if(!allAds.length){lists.forEach(el=>el.innerHTML='<div class="ltd">No ad-level data. Try wider date range.</div>');return}
  const sorted=allAds.sort((a,b)=>b.roas-a.roas||b.purchases-a.purchases);
  const html=`<table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead><tr style="background:var(--sf2)">
      <th style="text-align:left;padding:7px 12px;font-size:10px;color:var(--txm);border-bottom:1px solid var(--br);text-transform:uppercase">Ad</th>
      <th style="text-align:left;padding:7px 12px;font-size:10px;color:var(--txm);border-bottom:1px solid var(--br);text-transform:uppercase">Campaign</th>
      <th style="text-align:right;padding:7px 12px;font-size:10px;color:var(--txm);border-bottom:1px solid var(--br);text-transform:uppercase">Spend</th>
      <th style="text-align:right;padding:7px 12px;font-size:10px;color:var(--txm);border-bottom:1px solid var(--br);text-transform:uppercase">Purchases</th>
      <th style="text-align:right;padding:7px 12px;font-size:10px;color:var(--txm);border-bottom:1px solid var(--br);text-transform:uppercase">CPP</th>
      <th style="text-align:right;padding:7px 12px;font-size:10px;color:var(--txm);border-bottom:1px solid var(--br);text-transform:uppercase">ROAS</th>
      <th style="padding:7px 12px;font-size:10px;color:var(--txm);border-bottom:1px solid var(--br);text-transform:uppercase">Score</th>
    </tr></thead>
    <tbody>${sorted.slice(0,15).map((a,i)=>{const isW=i===0;const sc=Math.round(a.roas*30+a.purchases*10+a.ctr*5);return`<tr style="${isW?'background:rgba(245,166,35,.08)':''}">
      <td style="padding:8px 12px;border-bottom:1px solid var(--br);font-weight:600">${isW?'🏆 ':''}${esc(a.name)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid var(--br);font-size:11px;color:var(--txm)">${esc(a.campaign)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid var(--br);text-align:right;font-family:monospace;font-size:11px">${mn(a.spend)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid var(--br);text-align:right">${a.purchases?`<b class="tg">${a.purchases}</b>`:'—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid var(--br);text-align:right;font-size:11px">${a.cpp?mn(a.cpp):'—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid var(--br);text-align:right">${a.roas?`<b>${a.roas.toFixed(2)}x</b>`:'—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid var(--br)"><div class="score-bar"><div class="score-track"><div class="score-fill" style="width:${Math.min(sc,100)}%"></div></div><span style="font-size:10px;color:var(--txm);margin-left:4px">${sc}</span></div></td>
    </tr>`}).join('')}</tbody>
  </table>`;
  lists.forEach(el=>el.innerHTML=html);
}

// ═══════════════════════════════════════
// FREQUENCY FATIGUE
// ═══════════════════════════════════════
async function renderFreqList(){
  const list=document.getElementById('freq-list');if(!list||!accounts.length)return;
  list.innerHTML='<div class="ltd"><div class="spin"></div>Checking frequency…</div>';
  const dp=dpParams();let freqData=[];
  for(const acct of accounts.slice(0,5)){
    try{
      const r=await apiFetch('/'+acct.id+'/insights',{fields:'campaign_name,campaign_id,frequency,reach,impressions',level:'campaign',limit:50,...dp});
      (r.data||[]).forEach(d=>{if(pf(d.frequency)>=3)freqData.push({campaign:d.campaign_name||d.campaign_id,frequency:pf(d.frequency),reach:pi(d.reach),account:acct.name})});
    }catch(e){}
  }
  if(!freqData.length){list.innerHTML='<div class="ltd" style="font-size:12px;color:var(--green-tx)">✓ কোনো campaign-এ frequency fatigue নেই (সব < 3)</div>';return}
  freqData.sort((a,b)=>b.frequency-a.frequency);
  list.innerHTML=freqData.map(d=>{
    const isHigh=d.frequency>=5;const isMed=d.frequency>=3&&d.frequency<5;
    const color=isHigh?'var(--red)':isMed?'var(--amber)':'var(--green)';
    const label=isHigh?'🔴 Critical':'🟡 Warning';
    return`<div style="background:var(--sf2);border:1px solid var(--br);border-radius:var(--rs);padding:10px 12px;margin-bottom:7px;border-left:3px solid ${color}">
      <div style="font-size:12px;font-weight:600;margin-bottom:2px">${label} ${esc(d.campaign)}</div>
      <div style="font-size:11px;color:var(--txm)">Frequency: <b style="color:${color}">${d.frequency.toFixed(1)}</b> · Reach: ${num(d.reach)} · Account: ${esc(d.account)}</div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════
// AI CREATIVE GENERATOR
// ═══════════════════════════════════════
async function runCreativeGen(){
  const btn=document.getElementById('cr-btn');const out=document.getElementById('cr-output');
  const product=document.getElementById('cr-product').value.trim();
  const audience=document.getElementById('cr-audience').value.trim();
  const tone=document.getElementById('cr-tone').value;
  const goal=document.getElementById('cr-goal').value;
  if(!product){showToast('Product name দাও','w');return}
  btn.disabled=true;btn.textContent='⏳ Generating…';
  out.innerHTML='<div class="spin" style="margin:12px auto"></div>';
  const prompt=`তুমি একজন expert Facebook Ads copywriter। নিচের জন্য high-converting ad creative তৈরি করো।

Product/Service: ${product}
Target audience: ${audience||'General'}
Tone: ${tone}
Goal: ${goal}

এই format-এ দাও:

## 3টা Headline (৪০ character max প্রতিটা)
1. ...
2. ...
3. ...

## 3টা Primary text / Copy (১৫০ character max)
1. ...
2. ...
3. ...

## Image/Video prompt (Midjourney/DALL-E এর জন্য, English-এ)
...

## CTA suggestion
...

বাংলায় লিখো (image prompt ছাড়া)`;

  const reply=await gemini(prompt);
  btn.disabled=false;btn.textContent='✨ Generate with Gemini';
  if(!reply){out.innerHTML='<div style="color:var(--red-tx);padding:10px">Error: Gemini key set করো</div>';return}
  out.innerHTML=`<div style="background:var(--pril);border:1px solid var(--pri);border-radius:var(--rs);padding:14px;font-size:12px;line-height:1.8;color:var(--tx)">${
    reply.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
      .replace(/^## (.*)/gm,'<div style="font-weight:700;font-size:12px;color:var(--pritx);margin:10px 0 4px">$1</div>')
      .replace(/\n/g,'<br>')
  }</div>
  <div style="display:flex;justify-content:flex-end;margin-top:8px">
    <button onclick="document.getElementById('cr-saved').innerHTML=document.getElementById('cr-output').innerHTML;closeModal('creative-gen-modal');showToast('✓ Saved to Creatives tab','i')">Save to Creatives tab →</button>
  </div>`;
}

// ═══════════════════════════════════════
// AD LIBRARY
// ═══════════════════════════════════════
async function searchAdLibrary(){
  const q=document.getElementById('adlib-query').value.trim();
  const country=document.getElementById('adlib-country').value;
  const results=document.getElementById('adlib-results');
  if(!q){showToast('Search keyword দাও','w');return}
  results.innerHTML='<div class="ltd"><div class="spin"></div>Searching Meta Ad Library…</div>';
  try{
    const r=await apiFetch('/ads_archive',{search_terms:q,ad_reached_countries:`["${country}"]`,ad_active_status:'ACTIVE',fields:'id,ad_creative_bodies,ad_creative_link_titles,page_name,ad_delivery_start_time,impressions',limit:20});
    const ads=r.data||[];
    if(!ads.length){results.innerHTML='<div style="padding:14px;font-size:12px;color:var(--txm)">কোনো active ad পাওয়া যায়নি। অন্য keyword try করো।</div>';return}
    results.innerHTML=ads.map(ad=>`<div style="background:var(--sf2);border:1px solid var(--br);border-radius:var(--rs);padding:12px;margin-bottom:8px;transition:border-color .15s" onmouseover="this.style.borderColor='var(--pri)'" onmouseout="this.style.borderColor='var(--br)'">
      <div style="font-size:12px;font-weight:600;margin-bottom:4px;display:flex;align-items:center;gap:6px">🏢 ${esc(ad.page_name||'Unknown page')}</div>
      ${ad.ad_creative_link_titles?`<div style="font-size:12px;font-weight:500;color:var(--pri-tx);margin-bottom:4px">${esc(ad.ad_creative_link_titles[0]||'')}</div>`:''}
      ${ad.ad_creative_bodies?`<div style="font-size:12px;color:var(--txm);margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(ad.ad_creative_bodies[0]||'')}</div>`:''}
      <div style="display:flex;gap:10px;font-size:11px;color:var(--txh)">
        <span>Started: ${ad.ad_delivery_start_time?ad.ad_delivery_start_time.split('T')[0]:'—'}</span>
        ${ad.impressions?`<span>Impressions: ${ad.impressions.lower_bound||0}+</span>`:''}
      </div>
    </div>`).join('');
  }catch(e){results.innerHTML=`<div style="padding:14px;font-size:12px;color:var(--red-tx)">Error: ${e.message}<br><small>Note: Ad Library API requires special Facebook app permissions.</small></div>`}
}

// ═══════════════════════════════════════
// ALERTS — CPP SPIKE + FREQUENCY
// ═══════════════════════════════════════
function checkAlerts(){
  const maxCPP=pf(document.getElementById('tc')?.value)||5;
  campaigns.filter(c=>c.purchases>0&&c.cpp>maxCPP*2&&c.status==='ACTIVE').slice(0,3).forEach(c=>{showToast(`🔴 CPP Spike: ${c.name}`,'d',`CPP ${mn(c.cpp)} — ${Math.round(c.cpp/maxCPP)}x above target`)});
}

// ═══════════════════════════════════════
// AD PREVIEWS
// ═══════════════════════════════════════
async function loadAdPreviews(){
  const grid=document.getElementById('adpg');
  const top=[...campaigns].filter(c=>c.status==='ACTIVE').sort((a,b)=>b.spend-a.spend).slice(0,8);
  if(!top.length){grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--txm)">No active campaigns</div>';return}
  grid.innerHTML='<div style="grid-column:1/-1" class="ltd"><div class="spin"></div>Loading…</div>';
  const cards=await Promise.all(top.map(async camp=>{let thumb=null;try{const r=await apiFetch('/'+camp.accountId+'/ads',{fields:'creative{thumbnail_url,image_url}',effective_status:'["ACTIVE"]',filtering:`[{"field":"campaign.id","operator":"IN","value":["${camp.id}"]}]`,limit:1});thumb=r.data?.[0]?.creative?.thumbnail_url||r.data?.[0]?.creative?.image_url||null}catch(e){}return{camp,thumb}}));
  grid.innerHTML=cards.map(({camp,thumb})=>`<div class="adpc" onclick="openAdModal('${camp.id}','${esc(camp.name)}')">
    ${thumb?`<img src="${thumb}" alt="ad">`:`<div class="adpc-np">📷<span>No preview</span></div>`}
    <div class="adpc-info"><div class="adpc-name">${esc(camp.name)}</div><div class="adpc-meta">${mn(camp.spend)} · ${camp.purchases} purchases</div></div>
  </div>`).join('');
}
async function openAdModal(campId,campName){
  s('adm-title',campName);openModal('ad-modal');
  const body=document.getElementById('adm-body');body.innerHTML='<div class="ltd"><div class="spin"></div>Loading…</div>';
  const camp=campaigns.find(c=>c.id===campId);if(!camp){body.innerHTML='<div class="ltd">Not found</div>';return}
  try{
    const r=await apiFetch('/'+camp.accountId+'/ads',{fields:'id,name,status,creative{title,body,thumbnail_url,image_url,call_to_action_type}',filtering:`[{"field":"campaign.id","operator":"IN","value":["${campId}"]}]`,limit:8});
    const ads=r.data||[];
    if(!ads.length){body.innerHTML='<div class="ltd">No ads found</div>';return}
    body.innerHTML=ads.map(ad=>{const cr=ad.creative||{};const img=cr.thumbnail_url||cr.image_url;return`<div style="margin-bottom:12px;background:var(--sf2);border-radius:var(--rs);overflow:hidden">
      ${img?`<img src="${img}" style="width:100%;max-height:220px;object-fit:cover;display:block">`:'<div style="height:90px;background:var(--sf3);display:flex;align-items:center;justify-content:center;color:var(--txh);font-size:11px">No image</div>'}
      <div style="padding:9px 11px"><div style="font-weight:600;font-size:13px;margin-bottom:3px">${esc(cr.title||ad.name||'Ad')}</div>${cr.body?`<div style="font-size:12px;color:var(--txm)">${esc(cr.body)}</div>`:''}<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:5px"><span style="font-size:10px;background:var(--gbg);color:var(--gtx);padding:2px 6px;border-radius:99px">${ad.status}</span>${cr.call_to_action_type?`<span style="font-size:10px;background:var(--pril);color:var(--pritx);padding:2px 6px;border-radius:99px">${cr.call_to_action_type.replace(/_/g,' ')}</span>`:''}</div></div>
    </div>`}).join('');
    body.innerHTML+=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px">
      <div style="background:var(--sf2);border-radius:var(--rs);padding:8px 10px"><div style="font-size:10px;color:var(--txh);text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px">Spend</div><div style="font-size:14px;font-weight:700">${mn(camp.spend)}</div></div>
      <div style="background:var(--sf2);border-radius:var(--rs);padding:8px 10px"><div style="font-size:10px;color:var(--txh);text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px">Purchases</div><div style="font-size:14px;font-weight:700;color:var(--green)">${camp.purchases||'—'}</div></div>
      <div style="background:var(--sf2);border-radius:var(--rs);padding:8px 10px"><div style="font-size:10px;color:var(--txh);text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px">CPP</div><div style="font-size:14px;font-weight:700">${camp.cpp?mn(camp.cpp):'—'}</div></div>
      <div style="background:var(--sf2);border-radius:var(--rs);padding:8px 10px"><div style="font-size:10px;color:var(--txh);text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px">ROAS</div><div style="font-size:14px;font-weight:700">${camp.roas?camp.roas.toFixed(2)+'x':'—'}</div></div>
    </div>`;
  }catch(e){body.innerHTML=`<div class="ltd">Error: ${e.message}</div>`}
}
