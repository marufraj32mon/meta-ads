// ═══════════════════════════════════════
// CONSTANTS & STATE
// ═══════════════════════════════════════
const TK='mads_tk6',RG='mads_rg6',GK='mads_gem';
const API='https://graph.facebook.com/v19.0';
const GEM_URL='https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const PROD_API='https://sells.alzeena.com.bd/public/api/products';
const BDT_USD_RATE=129;
const STOCK_CATEGORY_IDS={summer:[6,7,9,10,11,13,17,24,44],winter:[14,15,22,26,44,34],womens:[1,2,3,5,34,42]};
const COLS=['#7c3aed','#a855f7','#3ecf8e','#f5a623','#f75555','#2dd4bf','#fb923c','#e879f9','#34d399','#60a5fa','#f472b6','#fbbf24'];
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const WDAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

let token=localStorage.getItem(TK)||'';
let range=localStorage.getItem(RG)||'today';
let rangeLbl='Today';
let curView='accounts',audTab='age';
let selIds=new Set();
let accountSelectionInitialized=false;
let accounts=[],campaigns=[],audData={},rawAccounts=[];
let products=[],prodErr='',prodLoaded=false,timeReportCacheKey='',timeReportCache=null;
let aSort={f:'spend',d:-1},cSort={f:'spend',d:-1};
let cPage=1;const cPS=100000;
let charts={trend:null,perf:null,aud:null};
let selCamps=new Set();
let campMeta={};
let curNoteId=null;
let customStart=localStorage.getItem('mads_custom_start')||null,customEnd=localStorage.getItem('mads_custom_end')||null;
let dpLY,dpLM,dpRY,dpRM,dpS=null,dpE=null,dpHov=null,dpCust=false,dpPend=null;
let expandedCamps=new Set();
let adsetCache={};
let rules=[];let ruleIdCtr=1;
let budgetTargetId=null;
let cloneSourceId=null;
let compSummary={spend:0,purchases:0,cpp:0,roas:0};
let autoRefreshMs=parseInt(localStorage.getItem('mads_auto_refresh')||'0');
let autoRefreshTimer=null;
let campQuickFilter='all';
let badDayCfg={enabled:false,spend:10,autoPause:false};
let stockCategory='all',stockVisible=20;

// ═══════════════════════════════════════
// BOOT
// ═══════════════════════════════════════
window.onload=()=>{
  if(token){localStorage.setItem(TK,token);showDash();}
  else{
    document.getElementById('tok-sc').classList.remove('hidden');
    document.getElementById('tok-sc').style.display='flex';
  }
  const saved=localStorage.getItem('mads_theme')||'light';
  applyTheme(saved);
  updateAutoRefreshUI();
};
function showDash(){
  document.getElementById('tok-sc').classList.add('hidden');
  document.getElementById('tok-sc').style.display='none';
  document.getElementById('dash').classList.remove('hidden');
  const m={today:'Today',yesterday:'Yesterday',last_7d:'Last 7 days',last_14d:'Last 14 days',last_28d:'Last 28 days',last_30d:'Last 30 days',this_week:'This week',last_week:'Last week',this_month:'This month',last_month:'Last month',this_quarter:'This quarter',this_year:'This year',maximum:'Maximum',custom:'Custom range'};
  rangeLbl=range==='custom'&&customStart&&customEnd?dpFmtD(dpParseISO(customStart))+' – '+dpFmtD(dpParseISO(customEnd)):(m[range]||'Today');
  dpUpdTrigger();
  updateAutoRefreshUI();
  startAutoRefresh();
  loadBadDayProtection();
  loadAll();
}
function saveToken(){const v=document.getElementById('tok-inp').value.trim();if(!v)return;token=v;localStorage.setItem(TK,v);showDash()}
function changeToken(){const v=prompt('New access token:','');if(v){token=v.trim();localStorage.setItem(TK,token);loadAll()}}
function setGemKey(){const k=prompt('Gemini API key:',localStorage.getItem(GK)||'');if(k){localStorage.setItem(GK,k.trim());showToast('✓ Gemini key saved','i')}}
