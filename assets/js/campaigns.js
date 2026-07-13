// ═══════════════════════════════════════
// CAMPAIGNS TABLE
// ═══════════════════════════════════════
function setCampSort(f,btn){
  cSort.f=f;cSort.d=-1;cPage=1;
  document.querySelectorAll('.tab-pill').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  s('camp-chart-title','Top campaigns by '+f);
  renderCamp();renderCampChart();
}
function sC(f){cSort.d=cSort.f===f?-cSort.d:-1;cSort.f=f;cPage=1;renderCamp()}
function setCampQuickFilter(filter,btn){
  campQuickFilter=filter;
  document.querySelectorAll('.quick-filters .tab-pill').forEach(b=>b.classList.remove('on'));
  if(btn)btn.classList.add('on');
  cPage=1;
  renderCamp();
}
function getCampaignHealth(c){
  const maxCPP=pf(document.getElementById('tc')?.value)||5;
  const minROAS=pf(document.getElementById('troas')?.value)||2;
  let score=50;
  if(c.spend===0)score=35;
  if(c.purchases===0&&c.spend>=10)score-=30;
  if(c.purchases>0){
    if(c.cpp>0){
      if(c.cpp<=maxCPP)score+=18;
      else if(c.cpp<=maxCPP*1.4)score+=5;
      else score-=18;
    }
    if(c.roas>=minROAS)score+=20;
    else if(c.roas>0&&c.roas<minROAS)score-=12;
  }
  if(c.ctr>=2)score+=8;
  else if(c.impressions>1000&&c.ctr<1)score-=6;
  if(c.purchases>=5)score+=10;
  score=Math.max(0,Math.min(100,Math.round(score)));
  if(score>=80)return{score,label:'Winner',tone:'good'};
  if(score>=60)return{score,label:'Good',tone:'good'};
  if(score>=45)return{score,label:'Watch',tone:'watch'};
  return{score,label:'Kill',tone:'bad'};
}
function applyCampQuickFilter(data){
  const maxCPP=pf(document.getElementById('tc')?.value)||5;
  const minROAS=pf(document.getElementById('troas')?.value)||2;
  const spendVals=data.filter(c=>c.spend>0).map(c=>c.spend);
  const avgSpend=spendVals.length?spendVals.reduce((a,b)=>a+b,0)/spendVals.length:0;
  if(campQuickFilter==='winner')return data.filter(c=>c.purchases>0&&c.cpp<=maxCPP&&c.roas>=minROAS);
  if(campQuickFilter==='loss')return data.filter(c=>c.spend>0&&((c.purchases===0&&c.spend>=5)||c.cpp>maxCPP|| (c.roas>0&&c.roas<minROAS)));
  if(campQuickFilter==='no_purchase')return data.filter(c=>c.purchases===0);
  if(campQuickFilter==='high_cpp')return data.filter(c=>c.cpp>maxCPP);
  if(campQuickFilter==='high_roas')return data.filter(c=>c.roas>=minROAS);
  if(campQuickFilter==='high_spend')return data.filter(c=>c.spend>=avgSpend&&c.spend>0);
  return data;
}
function renderCamp(){
  const q=document.getElementById('srch').value.toLowerCase();
  const sf=document.getElementById('sf').value;
  const maxCPP=pf(document.getElementById('tc').value)||5;
  const minROAS=pf(document.getElementById('troas').value)||2;
  let data=campaigns.filter(c=>{
    const mQ=!q||c.name.toLowerCase().includes(q)||c.id.includes(q)||c.accountName.toLowerCase().includes(q);
    return mQ&&(!sf||c.status===sf);
  });
  data=applyCampQuickFilter(data);
  data.sort((a,b)=>cSort.d*((a[cSort.f]||0)>(b[cSort.f]||0)?1:-1));
  const total=data.length;const pages=1;
  cPage=1;const pd=data;
  s('camp-cnt',total+' campaigns');
  if(!pd.length){document.getElementById('ctb').innerHTML=`<tr><td colspan="16" class="ltd">No campaigns found</td></tr>`;document.getElementById('cpagi').innerHTML='';return}
  const mx=Math.max(...data.map(c=>c.spend),1);
  document.getElementById('ctb').innerHTML=pd.map(c=>{
    const bdg=c.status==='ACTIVE'?`<span class="badge b-a"><span class="dot dg"></span>Active</span>`:`<span class="badge b-p"><span class="dot da"></span>Paused</span>`;
    const sp=Math.round(c.spend/mx*100);
    const budget=c.daily_budget?mn(c.daily_budget,c.currency)+'/day':c.lifetime_budget?mn(c.lifetime_budget,c.currency)+' life':'—';
    const health=getCampaignHealth(c);
    const hasD=c.purchases>0;
    const isGood=hasD&&c.cpp<=maxCPP&&c.roas>=minROAS;
    const isBad=hasD&&(c.cpp>maxCPP||c.roas<minROAS);
    const isCppSpike=hasD&&c.cpp>maxCPP*2;
    const rowCls=isGood?'good':isBad?'bad':'';
    const cppCls=c.cpp&&c.purchases?c.cpp<=maxCPP?'tg':'tr2':'';
    const roasCls=c.roas?c.roas>=minROAS?'tg':'tr2':'';
    const meta=campMeta[c.id]||{};
    const lMap={winner:'🏆 Winner lw',testing:'🧪 Testing lt',scaling:'📈 Scaling ls',pause:'⏸ Pause lp'};
    const lbl=meta.label&&lMap[meta.label]?`<span class="clbl ${lMap[meta.label].split(' ')[1]}" onclick="event.stopPropagation();openNote('${c.id}','${esc(c.name)}')">${lMap[meta.label].split(' ')[0]}</span>`:'';
    const isOpen=expandedCamps.has(c.id);
    let rows=`<tr class="${rowCls} drill-row" onclick="toggleDrill('${c.id}')">
      <td onclick="event.stopPropagation()"><input type="checkbox" id="cb-${c.id}" ${selCamps.has(c.id)?'checked':''} onclick="event.stopPropagation();togCamp('${c.id}')"></td>
      <td class="tc"><span class="expand-icon ${isOpen?'open':''}">▸</span></td>
      <td><div style="font-weight:600;font-size:12px;max-width:175px;overflow:hidden;text-overflow:ellipsis" title="${esc(c.name)}">${esc(c.name)}</div>${lbl}${meta.note?`<span style="font-size:10px;color:var(--txh)"> 📝</span>`:''}${isCppSpike?`<span class="cspike">🔴 CPP spike</span>`:''}</td>
      <td class="mono" style="color:var(--txh);font-size:10px">${c.id}</td>
      <td><div style="font-size:11px;color:var(--txm);max-width:100px;overflow:hidden;text-overflow:ellipsis">${esc(c.accountName)}</div></td>
      <td class="tc">${bdg}</td>
      <td><div class="pbar"><div class="pt"><div class="pf" style="width:${sp}%"></div></div><span>${c.spend?mn(c.spend,c.currency):'—'}</span></div></td>
      <td class="tr">${c.purchases?`<b class="tg">${c.purchases}</b>`:`<span class="tm">—</span>`}</td>
      <td class="tr ${cppCls}">${c.cpp?mn(c.cpp,c.currency):`<span class="tm">—</span>`}</td>
      <td class="tr ${roasCls}">${c.roas?`<b>${c.roas.toFixed(2)}x</b>`:`<span class="tm">—</span>`}</td>
      <td class="tc"><div style="min-width:102px"><div class="score-bar"><div class="score-track"><div class="score-fill" style="width:${health.score}%"></div></div><span style="font-size:10px;color:var(--txm)">${health.score}</span></div><div class="health-pill ${health.tone}">${health.label}</div></div></td>
      <td class="tr">${c.impressions?num(c.impressions):`<span class="tm">—</span>`}</td>
      <td class="tr">${c.reach?num(c.reach):`<span class="tm">—</span>`}</td>
      <td class="tr">${c.ctr?c.ctr.toFixed(2)+'%':`<span class="tm">—</span>`}</td>
      <td class="tr" style="font-size:11px;color:var(--txm)">${budget}</td>
      <td onclick="event.stopPropagation()" style="white-space:nowrap">
        <button style="font-size:11px;padding:3px 5px;background:var(--gbg);color:var(--gtx);border-color:rgba(22,163,74,.3)" onclick="quickBudget('${c.id}',1.2)" title="+20%">+20%</button>
        <button style="font-size:11px;padding:3px 5px;background:var(--rbg);color:var(--rtx);border-color:rgba(220,38,38,.3)" onclick="quickBudget('${c.id}',0.8)" title="-20%">-20%</button>
        <button style="font-size:11px;padding:3px 5px" onclick="openBudgetModal('${c.id}')" title="Budget">💰</button>
        <button style="font-size:11px;padding:3px 5px" onclick="openCloneModal('${c.id}')" title="Clone">📋</button>
        <button style="font-size:11px;padding:3px 5px" onclick="openNote('${c.id}','${esc(c.name)}')" title="Note">📝</button>
      </td>
    </tr>`;
    if(isOpen)rows+=`<tr class="adset-sub"><td colspan="16" style="padding:0">${adsetSubHTML(c.id)}</td></tr>`;
    return rows;
  }).join('');
  const pEl=document.getElementById('cpagi');
  pEl.innerHTML=`<div class="campaign-all-note">Showing all ${total} campaigns on this page — no next page needed.</div>`;
}
function goPage(p){cPage=p;renderCamp()}

// ═══════════════════════════════════════
// AD SET DRILLDOWN
// ═══════════════════════════════════════
function toggleDrill(id){
  if(expandedCamps.has(id)){expandedCamps.delete(id);renderCamp();return}
  expandedCamps.add(id);renderCamp();
  if(!adsetCache[id])fetchAdsets(id);
}
async function fetchAdsets(campId){
  const camp=campaigns.find(c=>c.id===campId);if(!camp)return;
  adsetCache[campId]='loading';renderCamp();
  try{
    const dp=dpParams();
    const r=await apiFetch('/'+camp.accountId+'/adsets',{fields:'id,name,status,daily_budget',filtering:`[{"field":"campaign.id","operator":"IN","value":["${campId}"]}]`,limit:50});
    const rawAS=r.data||[];
    if(!rawAS.length){adsetCache[campId]=[];renderCamp();return}
    const ir=await apiFetch('/'+camp.accountId+'/insights',{fields:'adset_id,spend,purchase_roas,actions,cost_per_action_type,impressions,clicks',level:'adset',filtering:`[{"field":"campaign.id","operator":"IN","value":["${campId}"]}]`,limit:50,...dp});
    const imap={};(ir.data||[]).forEach(d=>imap[d.adset_id]=d);
    adsetCache[campId]=rawAS.map(as=>{
      const d=imap[as.id]||{};const pa=fA(d.actions);const ca=fA(d.cost_per_action_type);
      return{id:as.id,name:as.name,status:as.status,daily_budget:as.daily_budget?pi(as.daily_budget)/100:null,spend:pf(d.spend),purchases:pa?pi(pa.value):0,cpp:ca?pf(ca.value):0,roas:d.purchase_roas?pf(d.purchase_roas[0]?.value):0};
    });
  }catch(e){adsetCache[campId]=[]}
  renderCamp();
}
function adsetSubHTML(campId){
  const data=adsetCache[campId];
  if(data==='loading'||!data)return`<div style="padding:10px 12px 10px 32px;font-size:11px;color:var(--txm)"><div class="spin" style="width:14px;height:14px;border-width:1.5px;display:inline-block;margin:0 6px -3px 0"></div>Loading ad sets…</div>`;
  if(!data.length)return`<div style="padding:10px 12px 10px 32px;font-size:11px;color:var(--txm)">No ad sets found</div>`;
  return`<table style="width:100%;border-collapse:collapse">
    <thead><tr>
      <th style="padding:5px 11px 5px 32px;font-size:9px;color:var(--txh);text-transform:uppercase;text-align:left;background:var(--sf3)">Ad set</th>
      <th style="padding:5px 11px;font-size:9px;color:var(--txh);text-transform:uppercase;text-align:center;background:var(--sf3)">Status</th>
      <th style="padding:5px 11px;font-size:9px;color:var(--txh);text-transform:uppercase;text-align:right;background:var(--sf3)">Spend</th>
      <th style="padding:5px 11px;font-size:9px;color:var(--txh);text-transform:uppercase;text-align:right;background:var(--sf3)">Purchases</th>
      <th style="padding:5px 11px;font-size:9px;color:var(--txh);text-transform:uppercase;text-align:right;background:var(--sf3)">CPP</th>
      <th style="padding:5px 11px;font-size:9px;color:var(--txh);text-transform:uppercase;text-align:right;background:var(--sf3)">ROAS</th>
      <th style="padding:5px 11px;font-size:9px;color:var(--txh);text-transform:uppercase;text-align:right;background:var(--sf3)">Budget/day</th>
    </tr></thead>
    <tbody>${data.map(as=>`<tr>
      <td style="padding:6px 11px 6px 32px;font-size:11px;color:var(--txm)">${esc(as.name)}</td>
      <td style="padding:6px 11px;text-align:center">${as.status==='ACTIVE'?`<span class="badge b-a"><span class="dot dg"></span>On</span>`:`<span class="badge b-p"><span class="dot da"></span>Off</span>`}</td>
      <td style="padding:6px 11px;text-align:right;font-size:11px">${as.spend?mn(as.spend):'—'}</td>
      <td style="padding:6px 11px;text-align:right;font-size:11px">${as.purchases?`<b class="tg">${as.purchases}</b>`:'—'}</td>
      <td style="padding:6px 11px;text-align:right;font-size:11px">${as.cpp?mn(as.cpp):'—'}</td>
      <td style="padding:6px 11px;text-align:right;font-size:11px">${as.roas?as.roas.toFixed(2)+'x':'—'}</td>
      <td style="padding:6px 11px;text-align:right;font-size:11px;color:var(--txm)">${as.daily_budget?mn(as.daily_budget)+'/day':'—'}</td>
    </tr>`).join('')}</tbody>
  </table>`;
}

// ═══════════════════════════════════════
// BULK SELECT
// ═══════════════════════════════════════
function togCamp(id){selCamps.has(id)?selCamps.delete(id):selCamps.add(id);const cb=document.getElementById('cb-'+id);if(cb)cb.checked=selCamps.has(id);updBulk()}
function bulkToggleAll(cb){campaigns.forEach(c=>cb.checked?selCamps.add(c.id):selCamps.delete(c.id));updBulk();renderCamp()}
function updBulk(){const bar=document.getElementById('bulk-bar');bar.classList.toggle('show',selCamps.size>0);s('bulk-cnt',selCamps.size)}
function clearBulk(){selCamps.forEach(id=>{const cb=document.getElementById('cb-'+id);if(cb)cb.checked=false});selCamps.clear();updBulk()}
async function bulkAction(status){
  if(!selCamps.size)return;
  const ids=[...selCamps];showToast(`${status==='ACTIVE'?'Resuming':'Pausing'} ${ids.length} campaigns…`,'i');
  let ok=0;
  for(const id of ids){try{await fetch(`${API}/${id}?access_token=${token}`,{method:'POST',body:new URLSearchParams({status}),headers:{'Content-Type':'application/x-www-form-urlencoded'}});ok++}catch(e){}}
  showToast(`✓ Done: ${ok}/${ids.length}`,'i');clearBulk();setTimeout(refreshAll,1500);
}
async function bulkDeleteCampaigns() {
  if (!selCamps.size) return;

  const ids = [...selCamps];

  const selectedCampaigns = campaigns.filter(campaign =>
    selCamps.has(campaign.id)
  );

  const preview = selectedCampaigns
    .slice(0, 5)
    .map(campaign => `• ${campaign.name}`)
    .join('\n');

  const remaining =
    selectedCampaigns.length > 5
      ? `\n• আরও ${selectedCampaigns.length - 5}টি campaign`
      : '';

  const confirmed = window.confirm(
    `${ids.length}টি campaign delete করতে যাচ্ছেন।

${preview}${remaining}

এই action undo করা যাবে না। Continue?`
  );

  if (!confirmed) return;

  const typedConfirmation = window.prompt(
    'Confirm করতে DELETE লিখুন:',
    ''
  );

  if (typedConfirmation !== 'DELETE') {
    showToast(
      'Delete cancelled',
      'w',
      'Confirmation text did not match'
    );

    return;
  }

  showToast(
    `Deleting ${ids.length} campaigns…`,
    'w'
  );

  let deleted = 0;
  let failed = 0;

  for (const campaignId of ids) {
    try {
      const response = await fetch(
        `${API}/${campaignId}?access_token=${token}`,
        {
          method: 'DELETE'
        }
      );

      const data = await response.json();

      if (response.ok && !data.error) {
        deleted++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
    }
  }

  campaigns = campaigns.filter(
    campaign => !ids.includes(campaign.id)
  );

  clearBulk();
  renderSum();
  renderCamp();

  if (failed > 0) {
    showToast(
      `Deleted ${deleted}/${ids.length}`,
      'w',
      `${failed} campaign could not be deleted`
    );
  } else {
    showToast(
      `✓ Deleted ${deleted} campaigns`,
      'i'
    );
  }

  setTimeout(refreshAll, 1500);
}

// ═══════════════════════════════════════
// BUDGET ADJUSTER
// ═══════════════════════════════════════
function openBudgetModal(campId){
  const c=campaigns.find(x=>x.id===campId);if(!c)return;
  budgetTargetId=campId;s('budget-cname',c.name);
  const cur=c.daily_budget||10;
  s('budget-current','Current: '+(c.daily_budget?mn(c.daily_budget,c.currency)+'/day':'not set'));
  const sl=document.getElementById('budget-slider');sl.max=Math.max(200,Math.ceil(cur*3));sl.value=Math.round(cur);onBudgetSlide();
  openModal('budget-modal');
}
function onBudgetSlide(){s('budget-val','$'+document.getElementById('budget-slider').value)}
function setBudgetSlider(v){const sl=document.getElementById('budget-slider');if(parseInt(sl.max)<v)sl.max=v;sl.value=v;onBudgetSlide()}
function bumpBudget(mult){const sl=document.getElementById('budget-slider');const nv=Math.max(1,Math.round(pf(sl.value)*mult));if(parseInt(sl.max)<nv)sl.max=nv;sl.value=nv;onBudgetSlide()}
async function applyBudget(){
  if(!budgetTargetId)return;
  const newB=pf(document.getElementById('budget-slider').value);
  const c=campaigns.find(x=>x.id===budgetTargetId);if(!c)return;
  try{
    const nativeBudget=fromUSD(newB,c.originalCurrency);
    const res=await fetch(`${API}/${budgetTargetId}?access_token=${token}`,{method:'POST',body:new URLSearchParams({daily_budget:Math.round(nativeBudget*100)}),headers:{'Content-Type':'application/x-www-form-urlencoded'}});
    const d=await res.json();if(d.error){showToast('Budget update failed','d',d.error.message);return}
    c.daily_budget=newB;showToast('✓ Budget updated','i',`${esc(c.name)} → ${mn(newB)}/day`);closeModal('budget-modal');renderCamp();
  }catch(e){showToast('Error','d',e.message)}
}
async function quickBudget(campId,mult){
  const c=campaigns.find(x=>x.id===campId);if(!c||!c.daily_budget){showToast('No daily budget set','w','💰 Use the budget modal');return}
  const newB=Math.max(1,Math.round(c.daily_budget*mult));
  showToast(`${mult>1?'↑':''} Budget ${mult>1?'+':'-'}20%…`,'i',`${mn(c.daily_budget)} → ${mn(newB)}/day`);
  try{
    const nativeBudget=fromUSD(newB,c.originalCurrency);
    const res=await fetch(`${API}/${campId}?access_token=${token}`,{method:'POST',body:new URLSearchParams({daily_budget:Math.round(nativeBudget*100)}),headers:{'Content-Type':'application/x-www-form-urlencoded'}});
    const d=await res.json();if(d.error){showToast('Failed','d',d.error.message);return}
    c.daily_budget=newB;showToast('✓ Updated','i',`${esc(c.name)}: ${mn(newB)}/day`);renderCamp();
  }catch(e){showToast('Error','d',e.message)}
}

// ═══════════════════════════════════════
// CAMPAIGN CLONER
// ═══════════════════════════════════════
function openCloneModal(campId){
  const c=campaigns.find(x=>x.id===campId);if(!c)return;cloneSourceId=campId;
  s('clone-source-name',c.name+' ('+c.accountName+')');
  document.getElementById('clone-new-name').value=c.name+' - Copy';
  document.getElementById('clone-budget').value=c.daily_budget||10;
  document.getElementById('clone-target-acct').innerHTML=accounts.filter(a=>a.account_status===1).map(a=>`<option value="${a.id}" ${a.id===c.accountId?'selected':''}>${esc(a.name)}</option>`).join('');
  openModal('clone-modal');
}
async function executeClone(){
  if(!cloneSourceId)return;
  const c=campaigns.find(x=>x.id===cloneSourceId);if(!c)return;
  const targetAcct=document.getElementById('clone-target-acct').value;
  const newName=document.getElementById('clone-new-name').value.trim()||c.name+' - Copy';
  const newB=pf(document.getElementById('clone-budget').value)||10;
  const target=accounts.find(a=>a.id===targetAcct);
  const nativeBudget=fromUSD(newB,target?.originalCurrency);
  const btn=document.getElementById('clone-btn');btn.disabled=true;btn.textContent='⏳ Cloning…';
  try{
    const res=await fetch(`${API}/${targetAcct}/campaigns?access_token=${token}`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({name:newName,status:'PAUSED',special_ad_categories:'[]',daily_budget:Math.round(nativeBudget*100),objective:'OUTCOME_SALES'})});
    const d=await res.json();btn.disabled=false;btn.textContent='Clone';
    if(d.error){showToast('Clone failed','d',d.error.message);return}
    showToast('✓ Cloned!','i',`"${newName}" created as PAUSED`);closeModal('clone-modal');setTimeout(refreshAll,1500);
  }catch(e){btn.disabled=false;btn.textContent='Clone';showToast('Error','d',e.message)}
}

// ═══════════════════════════════════════
// NOTES & LABELS
// ═══════════════════════════════════════
function openNote(id,name){curNoteId=id;s('note-cname',name);document.getElementById('note-tx').value=campMeta[id]?.note||'';openModal('note-modal')}
function setLbl(lbl){if(!curNoteId)return;if(!campMeta[curNoteId])campMeta[curNoteId]={};campMeta[curNoteId].label=lbl}
function saveNote(){if(!curNoteId)return;if(!campMeta[curNoteId])campMeta[curNoteId]={};campMeta[curNoteId].note=document.getElementById('note-tx').value;showToast('✓ Note saved','i');closeModal('note-modal');renderCamp()}
