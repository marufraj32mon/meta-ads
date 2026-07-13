// ═══════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════
function renderAnalytics(){renderTrend();renderHeatmap();renderBestTimeDay();renderPerf();renderFunnel();renderProductCodes();renderProductIntelligence()}
async function renderTrend(){
  if(!accounts.length)return;
  const dp=dpParams();
  try{
    const r=await apiFetch('/'+accounts[0].id+'/insights',{fields:'spend,actions',time_increment:'1',level:'account',limit:200,...dp});
    const rows=(r.data||[]).sort((a,b)=>a.date_start.localeCompare(b.date_start));
    const lbls=rows.map(r=>new Date(r.date_start).toLocaleDateString('en-US',{month:'short',day:'numeric'}));
    const spD=rows.map(r=>pf(r.spend));
    const puD=rows.map(r=>{const p=fA(r.actions);return p?pi(p.value):0});
    drawTrend(lbls,spD,puD);
  }catch(e){drawTrend([],[],[])}
}
function drawTrend(lbls,spD,puD){
  const cv=document.getElementById('trend-cv');if(!cv)return;
  if(charts.trend){charts.trend.destroy();charts.trend=null}
  const gc='rgba(124,58,237,.08)',tc=getComputedStyle(document.documentElement).getPropertyValue('--txh').trim()||'#888';
  charts.trend=new Chart(cv,{type:'line',data:{labels:lbls,datasets:[{label:'Spend ($)',data:spD,borderColor:'#7c3aed',backgroundColor:'rgba(124,58,237,.1)',fill:true,tension:.4,pointRadius:3,yAxisID:'y'},{label:'Purchases',data:puD,borderColor:'#3ecf8e',backgroundColor:'rgba(62,207,142,.1)',fill:true,tension:.4,pointRadius:3,yAxisID:'y1'}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{labels:{color:tc,font:{size:11}}},tooltip:{backgroundColor:'rgba(20,15,30,.95)',borderColor:'rgba(124,58,237,.2)',borderWidth:1,titleColor:'#f0ebff',bodyColor:'#a89dc0',callbacks:{label:c=>c.dataset.label+': '+(c.datasetIndex===0?'$'+c.parsed.y.toFixed(2):c.parsed.y)}}},scales:{x:{grid:{color:gc},ticks:{color:tc,maxTicksLimit:10,font:{size:10}}},y:{grid:{color:gc},ticks:{color:tc,font:{size:10},callback:v=>'$'+v},position:'left'},y1:{grid:{display:false},ticks:{color:tc,font:{size:10}},position:'right'}}}});
}
async function renderHeatmap(){
  const wrap=document.getElementById('hm-wrap');if(!accounts.length){wrap.innerHTML='<div class="ltd">No data</div>';return}
  const dp=dpParams();let hmap={};
  try{
    const r=await apiFetch('/'+accounts[0].id+'/insights',{fields:'actions',breakdowns:'hourly_stats_aggregated_by_advertiser_time_zone',level:'account',limit:300,...dp});
    (r.data||[]).forEach(d=>{const h=pi(d.hourly_stats_aggregated_by_advertiser_time_zone);const p=fA(d.actions);if(p)hmap[h]=(hmap[h]||0)+pi(p.value)});
  }catch(e){const tot=accounts.reduce((s,a)=>s+a.purchases,0)||50;[9,10,11,14,15,20,21,22].forEach(h=>hmap[h]=Math.round(tot*.1));[8,12,13,16,18,19].forEach(h=>hmap[h]=Math.round(tot*.04))}
  const hrs=Array.from({length:24},(_,i)=>i);const mx=Math.max(...hrs.map(h=>hmap[h]||0),1);
  const gc=v=>{const p=v/mx;if(!p)return'rgba(124,58,237,.06)';if(p<.25)return'rgba(124,58,237,.2)';if(p<.5)return'rgba(124,58,237,.45)';if(p<.75)return'rgba(124,58,237,.7)';return'rgba(124,58,237,.95)'};
  const cW=Math.max(16,Math.floor((wrap.clientWidth-44)/24));
  let h=`<div style="margin-left:32px;display:flex;gap:2px;margin-bottom:3px">${hrs.map(h=>`<div style="width:${cW}px;font-size:9px;color:var(--txh);text-align:center;flex-shrink:0">${h}</div>`).join('')}</div>`;
  h+=`<div style="display:flex;align-items:center;gap:2px"><div style="font-size:9px;color:var(--txh);width:30px;text-align:right">All</div>${hrs.map(hr=>`<div title="${hr}:00 → ${hmap[hr]||0} purchases" style="width:${cW}px;height:28px;border-radius:3px;background:${gc(hmap[hr]||0)};flex-shrink:0"></div>`).join('')}</div>`;
  h+=`<div style="display:flex;align-items:center;gap:6px;margin-top:8px;font-size:10px;color:var(--txh)"><span>Low</span>${['0.06','0.2','0.45','0.7','0.95'].map(o=>`<div style="width:12px;height:8px;border-radius:2px;background:rgba(124,58,237,${o})"></div>`).join('')}<span>High</span></div>`;
  wrap.innerHTML=h;
}
function renderPerf(){
  const cv=document.getElementById('perf-cv');if(!cv)return;
  if(charts.perf){charts.perf.destroy();charts.perf=null}
  const cs=campaigns.filter(c=>c.spend>0).sort((a,b)=>b.spend-a.spend).slice(0,15);if(!cs.length)return;
  const maxCPP=pf(document.getElementById('tc')?.value)||5;const minROAS=pf(document.getElementById('troas')?.value)||2;
  const gc='rgba(124,58,237,.08)',tc=getComputedStyle(document.documentElement).getPropertyValue('--txh').trim()||'#888';
  const bg=cs.map(c=>{if(!c.purchases)return'rgba(139,139,136,.4)';if(c.cpp<=maxCPP&&c.roas>=minROAS)return'rgba(62,207,142,.75)';return'rgba(247,85,85,.75)'});
  charts.perf=new Chart(cv,{type:'bar',data:{labels:cs.map(c=>c.name.length>22?c.name.slice(0,22)+'…':c.name),datasets:[{label:'Spend',data:cs.map(c=>c.spend),backgroundColor:bg,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'rgba(20,15,30,.95)',borderColor:'rgba(124,58,237,.2)',borderWidth:1,titleColor:'#f0ebff',bodyColor:'#a89dc0',callbacks:{label:ctx=>{const c=cs[ctx.dataIndex];return[`Spend: ${mn(c.spend)}`,`Purchases: ${c.purchases||'—'}`,`CPP: ${c.cpp?mn(c.cpp):'—'}`,`ROAS: ${c.roas?c.roas.toFixed(2)+'x':'—'}`]}}}},scales:{x:{grid:{display:false},ticks:{color:tc,font:{size:10},maxRotation:35}},y:{grid:{color:gc},ticks:{color:tc,font:{size:10},callback:v=>'$'+v}}}}});
}
function renderFunnel(){
  const wrap=document.getElementById('funnel-wrap');if(!wrap)return;
  const tI=accounts.reduce((s,a)=>s+a.impressions,0);
  const tC=accounts.reduce((s,a)=>s+a.clicks,0);
  const tP=accounts.reduce((s,a)=>s+a.purchases,0);
  if(!tI){wrap.innerHTML='<div class="ltd">No data</div>';return}
  const stages=[{label:'Impressions',val:tI,color:'#7c3aed'},{label:'Clicks',val:tC,color:'#a855f7'},{label:'Purchases',val:tP,color:'#3ecf8e'}];
  const maxV=stages[0].val||1;
  let h='';
  stages.forEach((st,i)=>{
    const pct=Math.max(Math.round(st.val/maxV*100),3);
    const dropP=i>0?(((stages[i-1].val-st.val)/(stages[i-1].val||1))*100):0;
    h+=`<div class="funnel-stage"><div class="funnel-label">${st.label}</div><div class="funnel-bar-track"><div class="funnel-bar-fill" style="width:${pct}%;background:${st.color}">${num(st.val)}</div></div><div class="funnel-stats">${i===0?'100% base':`<span style="color:var(--red-tx);font-weight:600">−${dropP.toFixed(1)}%</span> drop`}</div></div>`;
    if(i<stages.length-1)h+=`<div class="funnel-connector"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--txh)" stroke-width="2"><path d="M12 5v14M19 12l-7 7-7-7"/></svg></div>`;
  });
  const ctr=tI?((tC/tI)*100).toFixed(2):'0';const cvr=tC?((tP/tC)*100).toFixed(2):'0';
  h+=`<div style="display:flex;gap:16px;margin-top:14px;padding-top:12px;border-top:1px solid var(--br);font-size:11px;color:var(--txm)"><span>Click rate: <b style="color:var(--tx)">${ctr}%</b></span><span>Purchase rate: <b style="color:var(--tx)">${cvr}%</b></span></div>`;
  wrap.innerHTML=h;
}
function renderProductCodes(){
  const wrap=document.getElementById('product-code-wrap');if(!wrap)return;
  const codeMap={};
  campaigns.forEach(c=>{
    const match=c.name.match(/\b([A-Z]{2,5}[0-9]{1,4}|[A-Z]{1,4}-[0-9]{2,4})\b/g);
    if(match){match.forEach(code=>{if(!codeMap[code])codeMap[code]={spend:0,purchases:0,campaigns:0,cpp:0};codeMap[code].spend+=c.spend;codeMap[code].purchases+=c.purchases;codeMap[code].campaigns++;})}
  });
  const rows=Object.entries(codeMap).map(([code,v])=>({code,...v,cpp:v.purchases>0?v.spend/v.purchases:0})).sort((a,b)=>b.purchases-a.purchases);
  if(!rows.length){wrap.innerHTML='<div class="ltd" style="font-size:12px">Campaign name থেকে product code (e.g. TX62, PL150) auto-detect হবে।<br>কোনো pattern match হয়নি।</div>';return}
  wrap.innerHTML=`<table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead><tr style="background:var(--sf2)">
      <th style="text-align:left;padding:7px 12px;font-size:10px;color:var(--txm);border-bottom:1px solid var(--br);text-transform:uppercase">Product code</th>
      <th style="text-align:right;padding:7px 12px;font-size:10px;color:var(--txm);border-bottom:1px solid var(--br);text-transform:uppercase">Campaigns</th>
      <th style="text-align:right;padding:7px 12px;font-size:10px;color:var(--txm);border-bottom:1px solid var(--br);text-transform:uppercase">Spend</th>
      <th style="text-align:right;padding:7px 12px;font-size:10px;color:var(--txm);border-bottom:1px solid var(--br);text-transform:uppercase">Purchases</th>
      <th style="text-align:right;padding:7px 12px;font-size:10px;color:var(--txm);border-bottom:1px solid var(--br);text-transform:uppercase">CPP</th>
    </tr></thead>
    <tbody>${rows.map(r=>`<tr>
      <td style="padding:8px 12px;border-bottom:1px solid var(--br)"><span style="display:inline-flex;align-items:center;font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;background:var(--pril);color:var(--pritx);letter-spacing:.3px">${esc(r.code)}</span></td>
      <td style="padding:8px 12px;border-bottom:1px solid var(--br);text-align:right;font-size:11px">${r.campaigns}</td>
      <td style="padding:8px 12px;border-bottom:1px solid var(--br);text-align:right;font-family:monospace;font-size:11px">${mn(r.spend)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid var(--br);text-align:right">${r.purchases?`<b class="tg">${r.purchases}</b>`:'—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid var(--br);text-align:right;font-size:11px">${r.cpp>0?mn(r.cpp):'—'}</td>
    </tr>`).join('')}</tbody>
  </table>`;
}
