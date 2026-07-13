// ═══════════════════════════════════════
// MODALS / TOASTS / HELPERS
// ═══════════════════════════════════════
function openModal(id){document.getElementById(id).classList.add('open')}
function closeModal(id){document.getElementById(id).classList.remove('open')}
function showToast(title,type='i',body='',dur=5000){
  const wrap=document.getElementById('toasts');const id='t'+Date.now();
  const cls=type==='w'?'tw2':type==='d'?'td':'ti';
  const div=document.createElement('div');div.className='toast '+cls;div.id=id;
  div.innerHTML=`<div style="flex:1"><div class="ti-lbl">${esc(title)}</div>${body?`<div class="ti-body">${esc(body)}</div>`:''}</div><button class="t-close" onclick="document.getElementById('${id}').remove()">×</button>`;
  wrap.appendChild(div);setTimeout(()=>div.remove(),dur);
}
function ldTb(id,cols,msg){const el=document.getElementById(id);if(el)el.innerHTML=`<tr><td colspan="${cols}" class="ltd"><div class="spin"></div>${msg||'Loading…'}</td></tr>`}
function setErr(msg){const el=document.getElementById('err');el.textContent=msg;el.style.display=msg?'block':'none'}
function s(id,val){const el=document.getElementById(id);if(el)el.textContent=val}
function mn(n,cur){n=parseFloat(n)||0;if(cur&&cur!=='USD')return n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})+' '+cur;return'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
function num(n){n=parseInt(n)||0;if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1000)return(n/1000).toFixed(1)+'K';return n.toLocaleString()}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
