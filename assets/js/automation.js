// ═══════════════════════════════════════
// AUTOMATED RULES
// ═══════════════════════════════════════
function openRuleForm(){
  const wrap=document.getElementById('rule-form-wrap');if(wrap.innerHTML.trim()){wrap.innerHTML='';return}
  wrap.innerHTML=`<div class="rule-form">
    <div class="rule-form-row"><label>Condition</label><select id="rf-metric" style="flex:1"><option value="cpp_gt">CPP > threshold</option><option value="roas_lt">ROAS < threshold</option><option value="spend_gt_no_purchase">Spend > threshold (no purchase)</option></select></div>
    <div class="rule-form-row"><label>Threshold</label><input type="number" id="rf-value" value="10" step="0.5" style="width:90px"></div>
    <div class="rule-form-row"><label>Action</label><select id="rf-action" style="flex:1"><option value="pause">Auto pause</option><option value="alert">Alert only</option></select></div>
    <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:6px"><button onclick="document.getElementById('rule-form-wrap').innerHTML=''">Cancel</button><button class="btn-pri" onclick="saveRule()">Save rule</button></div>
  </div>`;
}
function saveRule(){
  const metric=document.getElementById('rf-metric').value;const value=pf(document.getElementById('rf-value').value);const action=document.getElementById('rf-action').value;
  const labels={cpp_gt:`CPP > ${mn(value)}`,roas_lt:`ROAS < ${value}x`,spend_gt_no_purchase:`Spend > ${mn(value)} (no purchase)`};
  rules.push({id:ruleIdCtr++,metric,value,action,enabled:true,desc:`${labels[metric]} → ${action==='pause'?'Auto pause':'Alert only'}`,triggered:0});
  document.getElementById('rule-form-wrap').innerHTML='';renderRules();showToast('✓ Rule saved','i');
}
function renderRules(){
  const list=document.getElementById('rule-list');if(!list)return;
  if(!rules.length){list.innerHTML='<div class="ltd" style="padding:16px">No rules yet</div>';return}
  list.innerHTML=rules.map(r=>`<div class="rule-card ${!r.enabled?'disabled-rule':''}">
    <div class="rule-icon">${r.action==='pause'?'⏸':'🔔'}</div>
    <div class="rule-content"><div class="rule-desc">${esc(r.desc)}</div><div class="rule-meta">Triggered ${r.triggered} times · ${r.enabled?'Active':'Disabled'}</div></div>
    <input type="checkbox" ${r.enabled?'checked':''} onchange="toggleRule(${r.id})">
    <button style="font-size:11px;padding:3px 7px" onclick="deleteRule(${r.id})">✕</button>
  </div>`).join('');
}
function toggleRule(id){const r=rules.find(x=>x.id===id);if(r)r.enabled=!r.enabled;renderRules()}
function deleteRule(id){rules=rules.filter(x=>x.id!==id);renderRules()}
async function evalRules(){
  if(!rules.length||!rules.some(r=>r.enabled))return;
  const toPause=[];
  campaigns.filter(c=>c.status==='ACTIVE').forEach(c=>{
    rules.filter(r=>r.enabled).forEach(r=>{
      let triggered=false;
      if(r.metric==='cpp_gt'&&c.purchases>0&&c.cpp>r.value)triggered=true;
      if(r.metric==='roas_lt'&&c.roas>0&&c.roas<r.value)triggered=true;
      if(r.metric==='spend_gt_no_purchase'&&c.purchases===0&&c.spend>r.value)triggered=true;
      if(triggered){r.triggered++;showToast(`⚙ Rule: ${c.name}`,'w',r.desc);if(r.action==='pause')toPause.push(c);}
    });
  });
  if(toPause.length){
    for(const c of toPause){try{await fetch(`${API}/${c.id}?access_token=${token}`,{method:'POST',body:new URLSearchParams({status:'PAUSED'}),headers:{'Content-Type':'application/x-www-form-urlencoded'}})}catch(e){}}
    setTimeout(refreshAll,1500);
  }
  renderRules();
}
