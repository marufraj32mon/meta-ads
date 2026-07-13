// ═══════════════════════════════════════
// API
// ═══════════════════════════════════════
async function apiFetch(path,params={}){
  const u=new URL(API+path);u.searchParams.set('access_token',token);
  Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v));
  const r=await fetch(u);const d=await r.json();
  if(d.error)throw new Error(d.error.message);
  return d;
}
function dpParams(){
  if(range==='custom'&&customStart&&customEnd)return{'time_range[since]':customStart,'time_range[until]':customEnd};
  const m={today:'today',yesterday:'yesterday',last_7d:'last_7d',last_14d:'last_14d',last_28d:'last_28d',last_30d:'last_30d',this_week:'this_week',last_week:'last_week',this_month:'this_month',last_month:'last_month',this_quarter:'this_quarter',this_year:'this_year',maximum:'maximum'};
  return{date_preset:m[range]||'today'};
}
function pf(v){return parseFloat(v)||0}
function pi(v){return parseInt(v)||0}
function fA(arr){if(!arr)return null;return arr.find(a=>a.action_type==='purchase'||a.action_type==='omni_purchase')||null}
function currencyRate(currency){return String(currency||'USD').toUpperCase()==='BDT'?BDT_USD_RATE:1}
function toUSD(value,currency){return pf(value)/currencyRate(currency)}
function fromUSD(value,currency){return pf(value)*currencyRate(currency)}

// ═══════════════════════════════════════
// LOAD DATA
// ═══════════════════════════════════════
async function loadAll(){
  setErr('');document.getElementById('lu').textContent='Loading…';
  ldTb('atb',10);ldTb('ctb',16);
  try{
    const res=await apiFetch('/me/adaccounts',{fields:'id,name,account_status,currency,business',limit:100});
    rawAccounts=res.data||[];
    if(!rawAccounts.length){setErr('No accounts found.');return}
    if(!accountSelectionInitialized){rawAccounts.filter(a=>a.account_status===1).forEach(a=>selIds.add(a.id));accountSelectionInitialized=true;}
    buildChips(rawAccounts);
    await loadSel(rawAccounts);
  }catch(e){setErr('API Error: '+e.message)}
}
async function loadSel(raw){
  const toLoad=(raw||rawAccounts).filter(a=>selIds.has(a.id));
  if(!toLoad.length){accounts=[];campaigns=[];audData={};compSummary={spend:0,purchases:0,cpp:0,roas:0};renderSum();renderCompareCard();renderBadDayList([]);renderView();return}
  ldTb('atb',10,`Loading ${toLoad.length} accounts…`);ldTb('ctb',16,'Fetching campaigns…');
  try{
    const [results,comparison]=await Promise.all([
      Promise.all(toLoad.map(fetchOne)),
      fetchYesterdaySummary(toLoad),
      loadProducts()
    ]);
    accounts=results.map(r=>r.acct);
    campaigns=results.flatMap(r=>r.camps);
    audData=Object.fromEntries(results.map(r=>[r.acct.id,r.aud]));
    compSummary=comparison;
    renderSum();renderCompareCard();renderView();renderAcctChart();renderCampChart();
    renderProductCopyBox();
    renderBadDayList(getBadDayHits());
    setTimeout(()=>{checkAlerts();checkBadDayProtection();},800);setTimeout(evalRules,1200);
    document.getElementById('lu').textContent='Updated '+new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
  }catch(e){setErr('Load error: '+e.message)}
}
function refreshAll(){loadSel()}
async function fetchOne(acct){
  const originalCurrency=String(acct.currency||'USD').toUpperCase();
  const base={id:acct.id,name:acct.name||acct.id,biz:acct.business?.name||'—',currency:'USD',originalCurrency,normalizedFromBDT:originalCurrency==='BDT',account_status:acct.account_status};
  let ins={spend:0,impressions:0,reach:0,clicks:0,ctr:0,purchases:0,cpp:0,roas:0};
  let active_campaigns=0,totalDailyBudget=0,camps=[],aud={age:[],placement:[],region:[]};
  const dp=dpParams();
  try{
    const r=await apiFetch('/'+acct.id+'/insights',{fields:'spend,impressions,reach,clicks,ctr,purchase_roas,actions,cost_per_action_type',level:'account',...dp});
    if(r.data?.[0]){const d=r.data[0];const pa=fA(d.actions);const ca=fA(d.cost_per_action_type);
      ins={spend:toUSD(d.spend,originalCurrency),impressions:pi(d.impressions),reach:pi(d.reach),clicks:pi(d.clicks),ctr:pf(d.ctr),purchases:pa?pi(pa.value):0,cpp:toUSD(ca?.value,originalCurrency),roas:d.purchase_roas?pf(d.purchase_roas[0]?.value):0};}
  }catch(e){}
  try{
    const r=await apiFetch('/'+acct.id+'/campaigns',{fields:'id,name,status,daily_budget,lifetime_budget',effective_status:'["ACTIVE","PAUSED"]',limit:200});
    const rawC=r.data||[];
    active_campaigns=rawC.filter(c=>c.status==='ACTIVE').length;
    totalDailyBudget=rawC.reduce((s,c)=>s+toUSD(pi(c.daily_budget)/100,originalCurrency),0);
    if(rawC.length){
      const ir=await apiFetch('/'+acct.id+'/insights',{fields:'campaign_id,spend,impressions,reach,clicks,ctr,purchase_roas,actions,cost_per_action_type',level:'campaign',limit:500,...dp});
      const imap={};(ir.data||[]).forEach(d=>imap[d.campaign_id||d.id]=d);
      camps=rawC.map(c=>{const d=imap[c.id]||{};const pa=fA(d.actions);const ca=fA(d.cost_per_action_type);
        return{id:c.id,name:c.name,accountId:acct.id,accountName:base.name,currency:'USD',originalCurrency,status:c.status,daily_budget:c.daily_budget?toUSD(pi(c.daily_budget)/100,originalCurrency):null,lifetime_budget:c.lifetime_budget?toUSD(pi(c.lifetime_budget)/100,originalCurrency):null,spend:toUSD(d.spend,originalCurrency),impressions:pi(d.impressions),reach:pi(d.reach),clicks:pi(d.clicks),ctr:pf(d.ctr),purchases:pa?pi(pa.value):0,cpp:toUSD(ca?.value,originalCurrency),roas:d.purchase_roas?pf(d.purchase_roas[0]?.value):0};});
    }
  }catch(e){}
  const normalizeBreakdown=rows=>(rows||[]).map(r=>({...r,spend:toUSD(r.spend,originalCurrency)}));
  try{const r=await apiFetch('/'+acct.id+'/insights',{fields:'spend,reach,actions,impressions',breakdowns:'age,gender',level:'account',limit:100,...dp});aud.age=normalizeBreakdown(r.data);}catch(e){}
  try{const r=await apiFetch('/'+acct.id+'/insights',{fields:'spend,reach,impressions,actions',breakdowns:'publisher_platform,platform_position',level:'account',limit:100,...dp});aud.placement=normalizeBreakdown(r.data);}catch(e){}
  try{const r=await apiFetch('/'+acct.id+'/insights',{fields:'spend,reach,actions',breakdowns:'region',level:'account',limit:30,...dp});aud.region=normalizeBreakdown(r.data);}catch(e){}
  return{acct:{...base,...ins,active_campaigns,totalDailyBudget},camps,aud};
}
async function fetchYesterdaySummary(list){
  let spend=0,purchases=0,roasSpend=0,roasValue=0;
  await Promise.all((list||[]).map(async acct=>{
    try{
      const r=await apiFetch('/'+acct.id+'/insights',{fields:'spend,purchase_roas,actions',level:'account',date_preset:'yesterday'});
      const d=r.data?.[0];
      if(!d)return;
      const sVal=toUSD(d.spend,acct.currency);
      const pa=fA(d.actions);
      spend+=sVal;
      purchases+=pa?pi(pa.value):0;
      const rv=d.purchase_roas?pf(d.purchase_roas[0]?.value):0;
      if(rv>0&&sVal>0){roasSpend+=sVal;roasValue+=sVal*rv;}
    }catch(e){}
  }));
  return{spend,purchases,cpp:purchases>0?spend/purchases:0,roas:roasSpend>0?roasValue/roasSpend:0};
}
