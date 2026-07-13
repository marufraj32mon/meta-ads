// ═══════════════════════════════════════
// AUDIENCE
// ═══════════════════════════════════════
function renderAudienceWinner(merged){
  const wrap=document.getElementById('aud-winner-wrap');if(!wrap)return;
  const summarise=(rows,keyFn,label)=>{
    const m={};(rows||[]).forEach(r=>{const k=keyFn(r)||'?';const p=fA(r.actions);if(!m[k])m[k]={label:k,spend:0,purchases:0,reach:0};m[k].spend+=pf(r.spend);m[k].purchases+=p?pi(p.value):0;m[k].reach+=pi(r.reach)});
    const arr=Object.values(m).map(x=>({...x,cpp:x.purchases?x.spend/x.purchases:0})).sort((a,b)=>b.purchases-a.purchases||a.cpp-b.cpp);
    const best=arr[0];return{label,best,rows:arr.slice(0,3)};
  };
  const blocks=[
    summarise(merged.age,r=>r.age,'Best Age'),
    summarise(merged.age,r=>r.gender,'Best Gender'),
    summarise(merged.placement,r=>(r.publisher_platform||'?')+'/'+(r.platform_position||'?'),'Best Placement'),
    summarise(merged.region,r=>r.region,'Best Region')
  ];
  if(!blocks.some(b=>b.best)){wrap.innerHTML='<div class="ltd">No audience winner data</div>';return;}
  wrap.innerHTML=`<div class="compare-grid">${blocks.map(b=>`<div class="compare-mini"><div class="k">${esc(b.label)}</div><div class="v" style="font-size:16px">${b.best?esc(b.best.label):'—'}</div><div class="sub">${b.best?`${b.best.purchases||0} purchases · CPP ${b.best.cpp?mn(b.best.cpp):'—'}`:'No data'}</div></div>`).join('')}</div><div style="font-size:11px;color:var(--txm);margin-top:10px">Suggestion: winning audience আলাদা ad set/creative angle দিয়ে test করুন।</div>`;
}
function setAudTab(tab,btn){audTab=tab;document.querySelectorAll('.atab').forEach(b=>b.classList.remove('on'));btn.classList.add('on');renderAudView()}
function renderAudView(){
  const lbl=accounts.slice(0,3).map(a=>a.name).join(', ')+(accounts.length>3?'…':'');s('aud-lbl',lbl);
  const merged={age:[],placement:[],region:[]};
  Object.values(audData).forEach(d=>{merged.age.push(...(d.age||[]));merged.placement.push(...(d.placement||[]));merged.region.push(...(d.region||[]))});
  const ct=document.getElementById('aud-ct');
  if(audTab==='age'){const m={};merged.age.forEach(r=>{const k=r.age||'?';const p=fA(r.actions);if(!m[k])m[k]={spend:0,purchases:0,reach:0};m[k].spend+=pf(r.spend);m[k].purchases+=p?pi(p.value):0;m[k].reach+=pi(r.reach)});renderAudTbl(ct,Object.entries(m).map(([k,v])=>({label:k,...v})).sort((a,b)=>b.purchases-a.purchases),'Age');drawAudChart(Object.entries(m).map(([k,v])=>({label:k,...v})).sort((a,b)=>b.purchases-a.purchases),'Purchases by age')}
  else if(audTab==='gender'){const m={};merged.age.forEach(r=>{const k=r.gender||'?';const p=fA(r.actions);if(!m[k])m[k]={spend:0,purchases:0,reach:0};m[k].spend+=pf(r.spend);m[k].purchases+=p?pi(p.value):0;m[k].reach+=pi(r.reach)});const rows=Object.entries(m).map(([k,v])=>({label:k,...v})).sort((a,b)=>b.purchases-a.purchases);renderAudTbl(ct,rows,'Gender');drawAudChart(rows,'Purchases by gender')}
  else if(audTab==='placement'){const m={};merged.placement.forEach(r=>{const k=(r.publisher_platform||'?')+'/'+(r.platform_position||'?');const p=fA(r.actions);if(!m[k])m[k]={spend:0,purchases:0,reach:0};m[k].spend+=pf(r.spend);m[k].purchases+=p?pi(p.value):0;m[k].reach+=pi(r.reach)});const rows=Object.entries(m).map(([k,v])=>({label:k,...v})).sort((a,b)=>b.spend-a.spend).slice(0,15);renderAudTbl(ct,rows,'Placement');drawAudChart(rows,'Spend by placement')}
  else{const rows=merged.region.map(r=>{const p=fA(r.actions);return{label:r.region||'?',spend:pf(r.spend),purchases:p?pi(p.value):0,reach:pi(r.reach)}}).sort((a,b)=>b.purchases-a.purchases).slice(0,15);renderAudTbl(ct,rows,'Region');drawAudChart(rows,'Purchases by region')}
  renderAudienceWinner(merged);
}
function renderAudTbl(container,rows,lCol){
  if(!rows.length){container.innerHTML='<div class="ltd">No audience data</div>';return}
  const mx=Math.max(...rows.map(r=>r.spend),1);
  container.innerHTML=`<table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:var(--sf2)">
    <th style="text-align:left;padding:7px 12px;font-size:10px;color:var(--txm);border-bottom:1px solid var(--br);text-transform:uppercase">${lCol}</th>
    <th style="text-align:right;padding:7px 12px;font-size:10px;color:var(--txm);border-bottom:1px solid var(--br);text-transform:uppercase">Spend</th>
    <th style="padding:7px 12px;font-size:10px;color:var(--txm);border-bottom:1px solid var(--br);text-transform:uppercase">Share</th>
    <th style="text-align:right;padding:7px 12px;font-size:10px;color:var(--txm);border-bottom:1px solid var(--br);text-transform:uppercase">Purchases</th>
    <th style="text-align:right;padding:7px 12px;font-size:10px;color:var(--txm);border-bottom:1px solid var(--br);text-transform:uppercase">Reach</th>
  </tr></thead><tbody>${rows.map(r=>{const p=Math.round(r.spend/mx*100);return`<tr>
    <td style="padding:8px 12px;border-bottom:1px solid var(--br);font-weight:500">${esc(r.label)}</td>
    <td style="padding:8px 12px;border-bottom:1px solid var(--br);text-align:right;font-family:monospace;font-size:11px">${r.spend?mn(r.spend):'—'}</td>
    <td style="padding:8px 12px;border-bottom:1px solid var(--br)"><div class="pbar"><div class="pt"><div class="pf" style="width:${p}%"></div></div><span style="font-size:11px">${p}%</span></div></td>
    <td style="padding:8px 12px;border-bottom:1px solid var(--br);text-align:right">${r.purchases?`<b class="tg">${r.purchases}</b>`:'—'}</td>
    <td style="padding:8px 12px;border-bottom:1px solid var(--br);text-align:right;font-size:11px;color:var(--txm)">${r.reach?num(r.reach):'—'}</td>
  </tr>`}).join('')}</tbody></table>`;
}
function drawAudChart(rows,title){
  const cv=document.getElementById('aud-cv');if(!cv)return;
  if(charts.aud){charts.aud.destroy();charts.aud=null}
  if(!rows.length)return;s('aud-cht',title);
  const top=rows.slice(0,10);const gc='rgba(124,58,237,.08)',tc=getComputedStyle(document.documentElement).getPropertyValue('--txh').trim()||'#888';
  charts.aud=new Chart(cv,{type:'bar',data:{labels:top.map(r=>r.label),datasets:[{label:'Spend',data:top.map(r=>r.spend),backgroundColor:'rgba(124,58,237,.7)',borderRadius:4,yAxisID:'y'},{label:'Purchases',data:top.map(r=>r.purchases),backgroundColor:'rgba(62,207,142,.7)',borderRadius:4,yAxisID:'y1'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc,font:{size:11}}}},scales:{x:{grid:{display:false},ticks:{color:tc,font:{size:11}}},y:{grid:{color:gc},ticks:{color:tc,font:{size:10},callback:v=>'$'+v},position:'left'},y1:{grid:{display:false},ticks:{color:tc,font:{size:10}},position:'right'}}}});
}
