// ═══════════════════════════════════════
// CHIPS
// ═══════════════════════════════════════
function buildChips(raw){
  document.getElementById('chips').innerHTML=raw.map(a=>{
    const ok=a.account_status===1,on=selIds.has(a.id);
    return`<div class="chip ${on?'on':''} ${!ok?'dead':''}" id="chip-${a.id}" onclick="togChip('${a.id}')" title="${ok?'Active':'Disabled'} · ${a.id}"><span class="cdot" style="${!ok?'background:var(--red)':''}"></span>${esc(a.name||a.id)}</div>`;
  }).join('');
}
function togChip(id){accountSelectionInitialized=true;selIds.has(id)?selIds.delete(id):selIds.add(id);document.getElementById('chip-'+id)?.classList.toggle('on',selIds.has(id));loadSel()}
function selAll(){accountSelectionInitialized=true;selIds=new Set(rawAccounts.map(a=>a.id));buildChips(rawAccounts);loadSel(rawAccounts)}
function clrAll(){accountSelectionInitialized=true;selIds.clear();buildChips(rawAccounts);loadSel(rawAccounts)}

// ═══════════════════════════════════════
// METRICS
// ═══════════════════════════════════════
function renderSum(){
  const ac=campaigns.filter(c=>c.status==='ACTIVE');
  const tS=accounts.reduce((s,a)=>s+a.spend,0);
  const tP=accounts.reduce((s,a)=>s+a.purchases,0);
  const wCPP=tP>0?tS/tP:0;
  const tSR=accounts.filter(a=>a.roas>0).reduce((s,a)=>s+a.spend,0);
  const wROAS=tSR>0?accounts.filter(a=>a.roas>0).reduce((s,a)=>s+(a.spend*a.roas),0)/tSR:0;
  s('m0',accounts.length);s('m0s',accounts.filter(a=>a.account_status===1).length+' active');
  s('m1',ac.length);s('m1s','of '+campaigns.length+' total');
  s('m2',mn(tS));s('m2s',rangeLbl);
  s('m3',tP||'—');
  s('m4',wCPP>0?mn(wCPP):'—');
  s('m5',wROAS>0?wROAS.toFixed(2)+'x':'—');
}
function calcDelta(cur,prev,inverse=false){
  const diff=(cur||0)-(prev||0);
  const pct=prev?((diff/prev)*100):(cur?100:0);
  const neutral=(cur||0)===(prev||0);
  const good=neutral?null:(inverse?diff<=0:diff>=0);
  return{diff,pct,neutral,good};
}
function fmtDeltaBadge(cur,prev,inverse=false){
  const d=calcDelta(cur,prev,inverse);
  if(d.neutral)return '<span class="delta neutral">• Flat</span>';
  return `<span class="delta ${d.good?'up':'down'}">${d.good?'↑':'↓'} ${Math.abs(d.pct).toFixed(1)}%</span>`;
}
function renderCompareCard(){
  const body=document.getElementById('compare-body');if(!body)return;
  if(!accounts.length){body.innerHTML='<div class="ltd" style="grid-column:1/-1">No data</div>';return;}
  const tS=accounts.reduce((s,a)=>s+a.spend,0);
  const tP=accounts.reduce((s,a)=>s+a.purchases,0);
  const wCPP=tP>0?tS/tP:0;
  const tSR=accounts.filter(a=>a.roas>0).reduce((s,a)=>s+a.spend,0);
  const wROAS=tSR>0?accounts.filter(a=>a.roas>0).reduce((s,a)=>s+(a.spend*a.roas),0)/tSR:0;
  const items=[
    {label:'Spend',current:mn(tS),prev:mn(compSummary.spend),curVal:tS,prevVal:compSummary.spend,inverse:false},
    {label:'Purchases',current:String(tP||0),prev:String(compSummary.purchases||0),curVal:tP,prevVal:compSummary.purchases,inverse:false},
    {label:'CPP',current:wCPP>0?mn(wCPP):'—',prev:compSummary.cpp>0?mn(compSummary.cpp):'—',curVal:wCPP,prevVal:compSummary.cpp,inverse:true},
    {label:'ROAS',current:wROAS>0?wROAS.toFixed(2)+'x':'—',prev:compSummary.roas>0?compSummary.roas.toFixed(2)+'x':'—',curVal:wROAS,prevVal:compSummary.roas,inverse:false}
  ];
  body.innerHTML=items.map(it=>`<div class="compare-mini"><div class="k">${it.label}</div><div class="v">${it.current}</div>${fmtDeltaBadge(it.curVal,it.prevVal,it.inverse)}<div class="sub">Yesterday: ${it.prev}</div></div>`).join('');
}

// ═══════════════════════════════════════
// ACCOUNTS TABLE
// ═══════════════════════════════════════
function sA(f){aSort.d=aSort.f===f?-aSort.d:-1;aSort.f=f;renderAcct()}
function renderAcct(){
  const q=document.getElementById('srch').value.toLowerCase();
  const sf=document.getElementById('sf').value;
  let data=accounts.filter(a=>{
    const mQ=!q||a.name.toLowerCase().includes(q)||a.id.includes(q);
    const st=a.account_status===1?(a.active_campaigns>0?'ACTIVE':'PAUSED'):'DISABLED';
    return mQ&&(!sf||st===sf);
  });
  data.sort((a,b)=>aSort.d*((a[aSort.f]||0)>(b[aSort.f]||0)?1:-1));
  s('acnt-cnt',data.length+' accounts');
  if(!data.length){ldTb('atb',10,'No accounts match');return}
  const mx=Math.max(...data.map(a=>a.spend),1);
  document.getElementById('atb').innerHTML=data.map(a=>{
    const st=a.account_status===1?(a.active_campaigns>0?'ACTIVE':'PAUSED'):'DISABLED';
    const bdg=st==='ACTIVE'?`<span class="badge b-a"><span class="dot dg"></span>Active</span>`:st==='PAUSED'?`<span class="badge b-p"><span class="dot da"></span>Paused</span>`:`<span class="badge b-d"><span class="dot dr"></span>Disabled</span>`;
    const sp=Math.round(a.spend/mx*100);
    let bb='—';
    if(a.totalDailyBudget>0&&a.spend>0){const p=Math.min(Math.round(a.spend/a.totalDailyBudget*100),100);const c=p>=90?'var(--red)':p>=70?'var(--amber)':'var(--green)';bb=`<div style="min-width:80px"><div class="bbt"><div class="bbf" style="width:${p}%;background:${c}"></div></div><div class="bbl">${p}% of ${mn(a.totalDailyBudget)}/day</div></div>`}
    return`<tr>
      <td><div style="font-weight:600;font-size:12px;max-width:170px;overflow:hidden;text-overflow:ellipsis">${esc(a.name)}</div><div style="font-size:10px;color:var(--txh);font-family:monospace">${a.id} · ${esc(a.biz)}</div></td>
      <td class="tc">${bdg}</td>
      <td class="tr">${a.active_campaigns?`<b>${a.active_campaigns}</b>`:`<span class="tm">0</span>`}</td>
      <td><div class="pbar"><div class="pt"><div class="pf" style="width:${sp}%"></div></div><span>${mn(a.spend,a.currency)}</span></div></td>
      <td>${bb}</td>
      <td class="tr">${a.purchases?`<b class="tg">${a.purchases}</b>`:`<span class="tm">—</span>`}</td>
      <td class="tr">${a.cpp?mn(a.cpp,a.currency):`<span class="tm">—</span>`}</td>
      <td class="tr">${a.roas?`<b>${a.roas.toFixed(2)}x</b>`:`<span class="tm">—</span>`}</td>
      <td class="tr">${a.reach?num(a.reach):`<span class="tm">—</span>`}</td>
      <td class="tr">${a.ctr?a.ctr.toFixed(2)+'%':`<span class="tm">—</span>`}</td>
    </tr>`;
  }).join('');
}
