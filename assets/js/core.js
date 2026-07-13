// ═══════════════════════════════════════
// THEME
// ═══════════════════════════════════════
function applyTheme(t){
  document.documentElement[t==='dark'?'setAttribute':'removeAttribute']('data-theme','dark');
  const btn=document.getElementById('theme-btn');
  if(btn)btn.textContent=t==='dark'?'🌙 Dark':'☀️ Light';
  localStorage.setItem('mads_theme',t);
}
function toggleTheme(){applyTheme(localStorage.getItem('mads_theme')==='dark'?'light':'dark')}

function updateAutoRefreshUI(){
  const sel=document.getElementById('auto-refresh');
  if(sel)sel.value=String(autoRefreshMs);
  const lbl=document.getElementById('live-status');
  if(lbl)lbl.textContent=autoRefreshMs?`Live every ${fmtAutoRefresh(autoRefreshMs)}`:'Live off';
}
function fmtAutoRefresh(ms){
  if(ms===30000)return '30s';
  if(ms===60000)return '1m';
  if(ms===300000)return '5m';
  return 'off';
}
function startAutoRefresh(){
  if(autoRefreshTimer){clearInterval(autoRefreshTimer);autoRefreshTimer=null;}
  if(autoRefreshMs>0){
    autoRefreshTimer=setInterval(()=>{
      if(token&&!document.hidden)refreshAll();
    },autoRefreshMs);
  }
}
function setAutoRefresh(ms){
  autoRefreshMs=parseInt(ms)||0;
  localStorage.setItem('mads_auto_refresh',String(autoRefreshMs));
  updateAutoRefreshUI();
  startAutoRefresh();
  showToast(autoRefreshMs?'✓ Auto refresh enabled':'Auto refresh off','i',autoRefreshMs?`Refresh every ${fmtAutoRefresh(autoRefreshMs)}`:'Manual refresh only');
}

// ═══════════════════════════════════════
// VIEW
// ═══════════════════════════════════════
function switchView(v){
  curView=v;
  ['accounts','campaigns','analytics','products','audience','creatives','ai'].forEach(n=>{
    document.getElementById('v-'+n).classList.toggle('hidden',n!==v);
    document.getElementById('vt-'+n).classList.toggle('on',n===v);
  });
  if(v==='ai')loadAdPreviews();
  else if(v==='creatives'){renderFreqList();detectWin();renderProductCopyBox();}
  else renderView();
  if(v==='products')renderStockList();
}
function renderView(){
  if(curView==='accounts')renderAcct();
  else if(curView==='campaigns')renderCamp();
  else if(curView==='analytics')renderAnalytics();
  else if(curView==='products')renderProductIntelligence();
  else if(curView==='audience')renderAudView();
}

// ═══════════════════════════════════════
