// ═══════════════════════════════════════
// PRODUCT INTELLIGENCE + BEST TIME/DAY
// ═══════════════════════════════════════
async function loadProducts(force=false){
  if(prodLoaded&&!force)return products;
  prodErr='';
  try{
    let r=await fetch('/api/product',{cache:'no-store'});
    if(!r.ok)r=await fetch(PROD_API,{cache:'no-store'});
    const data=await r.json();
    const list=Array.isArray(data)?data:(data.data||data.products||[]);
    products=list.map(normalizeProduct).filter(p=>p.name||p.code);
    prodLoaded=true;
  }catch(e){prodErr=e.message||'Products API failed';products=[];prodLoaded=true;}
  renderProductCopyBox();
  return products;
}
function normalizeProduct(p){
  const rawDetails=Array.isArray(p.details)?p.details:(Array.isArray(p.product_details)?p.product_details:(Array.isArray(p.variations)?p.variations:[]));
  const sizes=rawDetails.map(d=>({name:d.size?.size_name||d.size_name||d.size||String(d.product_size_id||'Size'),qty:pi(d.pro_qty??d.qty??d.stock??d.quantity),active:d.active!==0&&d.status!==0})).filter(x=>x.active);
  const apiStock=pi(p.total_stock??p.stock??p.qty??p.quantity);
  const totalStock=sizes.length?sizes.reduce((s,x)=>s+x.qty,0):apiStock;
  const img=p.product_image||p.image||p.thumbnail||p.featured_image||'';
  const price=pf(p.discount_price)||pf(p.flash_sell_price)||pf(p.sell_price)||pf(p.price)||0;
  const detailText=typeof p.product_details==='string'?p.product_details:(typeof p.details==='string'?p.details:'');
  return{raw:p,id:p.id,name:p.product_name||p.name||'',code:p.product_code||p.code||p.sku||'',slug:p.slug||'',details:detailText,image:img,price,sellPrice:pf(p.sell_price)||pf(p.regular_price),discountPrice:pf(p.discount_price),totalStock,sizes,status:p.product_status||p.status,subCategoryId:pi(p.product_sub_category_id??p.sub_category_id)};
}

function setStockCategory(category,btn){
  stockCategory=category;stockVisible=20;
  document.querySelectorAll('.stock-tabs .tab-pill').forEach(b=>b.classList.remove('on'));
  btn?.classList.add('on');renderStockList();
}
function resetStockList(){stockVisible=20;renderStockList()}
function loadMoreStock(){stockVisible+=20;renderStockList()}
function stockCategoryMatch(p){return stockCategory==='all'||(STOCK_CATEGORY_IDS[stockCategory]||[]).includes(p.subCategoryId)}
function renderStockList(){
  const wrap=document.getElementById('stock-list-wrap');if(!wrap)return;
  if(!prodLoaded){wrap.innerHTML='<div class="ltd"><div class="spin"></div>Loading stock from API…</div>';loadProducts().then(renderStockList);return;}
  if(prodErr){wrap.innerHTML=`<div class="ltd" style="color:var(--red)">Products API error: ${esc(prodErr)}</div>`;return;}
  const q=normKey(document.getElementById('stock-search')?.value||'');
  const filtered=products.filter(p=>stockCategoryMatch(p)&&(!q||normKey(p.code).includes(q)||normKey(p.name).includes(q))).sort((a,b)=>b.totalStock-a.totalStock||String(a.code).localeCompare(String(b.code)));
  const visible=filtered.slice(0,stockVisible);
  const table=visible.length?`<table><thead><tr><th>Product</th><th>Category</th><th>Size-wise stock</th><th class="tr">Total stock</th><th class="tc">Status</th></tr></thead><tbody>${visible.map(p=>{
    const low=p.totalStock<30;
    return `<tr style="${low?'background:var(--rbg)':''}"><td>${productMini(p)}</td><td><span class="clbl">ID ${p.subCategoryId||'—'}</span></td><td><div class="stock-sizes">${p.sizes.length?p.sizes.map(z=>`<span class="stock-size ${z.qty<30?'low':''}">${esc(z.name)}: ${z.qty}</span>`).join(''):'—'}</div></td><td class="tr ${low?'stock-danger':'stock-safe'}">${p.totalStock}</td><td class="tc"><span class="action-pill ${low?'action-guard':'action-scale'}">${low?'Below 30':'30+ ready'}</span></td></tr>`;
  }).join('')}</tbody></table>`:`<div class="ltd" style="padding:22px">এই category/search-এ কোনো product পাওয়া যায়নি।</div>`;
  const more=filtered.length>visible.length?`<div class="stock-more"><button onclick="loadMoreStock()">Load more (${filtered.length-visible.length} remaining)</button></div>`:'';
  wrap.innerHTML=table+more+`<div class="campaign-all-note">Showing ${visible.length} of ${filtered.length} products · Highest stock first · Minimum target 30</div>`;
}
function normKey(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'')}
function firstCode(v){return String(v||'').trim().split(/\s+/)[0]||''}
function matchProductCampaigns(p){
  const full=normKey(p.code),first=normKey(firstCode(p.code)),slug=normKey(p.slug);
  const keys=[full,first].filter(k=>k&&k.length>=3);
  if(!keys.length&&slug)keys.push(slug);
  return campaigns.filter(c=>{const n=normKey(c.name);return keys.some(k=>n.includes(k));});
}
function productPerf(p){
  const cs=matchProductCampaigns(p);const spend=cs.reduce((s,c)=>s+c.spend,0),purchases=cs.reduce((s,c)=>s+c.purchases,0);
  const roasSpend=cs.filter(c=>c.roas>0).reduce((s,c)=>s+c.spend,0);
  return{campaigns:cs.length,active:cs.filter(c=>c.status==='ACTIVE').length,spend,purchases,cpp:purchases?spend/purchases:0,roas:roasSpend?cs.filter(c=>c.roas>0).reduce((s,c)=>s+c.spend*c.roas,0)/roasSpend:0};
}
function productThumb(p){return p.image?`<img src="${esc(p.image)}" loading="lazy" onerror="this.style.display='none'">`:''}
function stockClass(q){return q<=5?'stock-low':q<=15?'stock-mid':'stock-hot'}
function productMini(p){return `<div class="product-mini">${productThumb(p)}<div><div class="pn">${esc(p.name)}</div><div class="pc">${esc(p.code||p.slug||'No code')} · ৳${num(p.price||p.sellPrice||0)}</div></div></div>`}
function productDecision(p,perf){
  const maxCPP=pf(document.getElementById('tc')?.value)||2;
  const minROAS=pf(document.getElementById('troas')?.value)||2;
  if(p.totalStock<=0)return{label:'Stop ads — stock out',tone:'action-guard',rank:0,reason:'Stock 0'};
  if(p.totalStock<=5&&perf.active)return{label:'Protect budget',tone:'action-guard',rank:10,reason:'Active ads + very low stock'};
  if(perf.purchases>=3&&perf.cpp>0&&perf.cpp<=maxCPP&&p.totalStock>=20)return{label:'Scale / Boost',tone:'action-scale',rank:100,reason:'Low CPP + enough stock'};
  if(perf.spend>=10&&perf.purchases===0)return{label:'Stop / New creative',tone:'action-refresh',rank:25,reason:'Spend আছে, purchase নেই'};
  if(perf.purchases>0&&perf.cpp>maxCPP*1.6)return{label:'Creative refresh',tone:'action-refresh',rank:45,reason:'CPP rising'};
  if(p.totalStock>=30&&perf.purchases<=1)return{label:'Dead stock push',tone:'action-watch',rank:55,reason:'High stock, low demand'};
  if(p.totalStock>=20&&!perf.campaigns)return{label:'Launch test ad',tone:'action-launch',rank:50,reason:'Stock আছে, ads match নেই'};
  return{label:'Watch',tone:'action-watch',rank:40,reason:'Monitor'};
}
function productRow(p,perf,decision){
  const cpp=perf.cpp?mn(perf.cpp):'—';
  const roas=perf.roas?perf.roas.toFixed(2)+'x':'—';
  return`<tr>
    <td>${productMini(p)}</td>
    <td class="tr"><span class="${stockClass(p.totalStock)}">${p.totalStock}</span></td>
    <td class="tr">${perf.active}/${perf.campaigns}</td>
    <td class="tr">${perf.purchases||'—'}</td>
    <td class="tr">${perf.spend?mn(perf.spend):'—'}</td>
    <td class="tr">${cpp}</td>
    <td class="tr">${roas}</td>
    <td><span class="action-pill ${decision.tone}">${esc(decision.label)}</span><div style="font-size:10px;color:var(--txh);margin-top:3px">${esc(decision.reason)}</div></td>
  </tr>`;
}
function productTable(rows,empty){
  return rows.length?`<table><thead><tr><th>Product</th><th class="tr">Stock</th><th class="tr">Active/Ads</th><th class="tr">Orders</th><th class="tr">Spend</th><th class="tr">CPP</th><th class="tr">ROAS</th><th>Decision</th></tr></thead><tbody>${rows.map(x=>productRow(x.p,x.perf,x.decision)).join('')}</tbody></table>`:`<div class="ltd" style="padding:18px;font-size:12px">${empty}</div>`;
}
function renderProductIntelligence(){
  const ids=['prod-boost-wrap','prod-alert-wrap','dead-stock-wrap','size-demand-wrap','creative-refresh-wrap','product-report-summary','product-winning-wrap','product-decision-wrap','product-size-demand-wrap','product-creative-refresh-wrap'];
  const hasTargets=ids.some(id=>document.getElementById(id));
  if(!hasTargets)return;
  if(!prodLoaded){
    ids.forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML='<div class="ltd"><div class="spin"></div>Loading products…</div>'});
    loadProducts().then(()=>renderProductIntelligence());
    return;
  }
  if(prodErr){
    ids.forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=`<div class="ltd" style="color:var(--red);padding:18px">Products API error: ${esc(prodErr)}<br><span style="color:var(--txm)">Website product API connect না হলে product report দেখাবে না।</span></div>`});
    return;
  }
  const enriched=products.map(p=>{const perf=productPerf(p);return{p,perf,decision:productDecision(p,perf)}}).sort((a,b)=>b.decision.rank-a.decision.rank||b.perf.purchases-a.perf.purchases||b.p.totalStock-a.p.totalStock);
  const winners=enriched.filter(x=>x.decision.label.includes('Scale')).sort((a,b)=>b.perf.purchases-a.perf.purchases||a.perf.cpp-b.perf.cpp).slice(0,12);
  const protect=enriched.filter(x=>x.p.totalStock<=10||x.decision.label.includes('Protect')||x.decision.label.includes('stock out')).sort((a,b)=>a.p.totalStock-b.p.totalStock||b.perf.spend-a.perf.spend).slice(0,12);
  const dead=enriched.filter(x=>x.decision.label.includes('Dead stock')||x.decision.label.includes('Launch test')).sort((a,b)=>b.p.totalStock-a.p.totalStock).slice(0,12);
  const refresh=enriched.filter(x=>x.decision.label.includes('Creative')||x.decision.label.includes('New creative')).sort((a,b)=>b.perf.spend-a.perf.spend).slice(0,12);
  const activeProducts=enriched.filter(x=>x.perf.campaigns>0).length;
  const noPurchaseSpend=enriched.filter(x=>x.perf.spend>=10&&x.perf.purchases===0).length;
  const totalStock=enriched.reduce((s,x)=>s+x.p.totalStock,0);
  const topName=winners[0]?.p?.code||winners[0]?.p?.name||'—';
  const summary=`<div class="pi-grid">
    <div class="pi-tile"><div class="pi-k">Winning products</div><div class="pi-v">${winners.length}</div><div class="pi-s">Top: ${esc(topName)}</div></div>
    <div class="pi-tile"><div class="pi-k">Creative refresh</div><div class="pi-v">${refresh.length}</div><div class="pi-s">High spend / CPP issue</div></div>
    <div class="pi-tile"><div class="pi-k">Matched products</div><div class="pi-v">${activeProducts}</div><div class="pi-s">Campaign name থেকে product match</div></div>
    <div class="pi-tile"><div class="pi-k">Total products</div><div class="pi-v">${products.length}</div><div class="pi-s">API products loaded</div></div>
    <div class="pi-tile"><div class="pi-k">Total stock</div><div class="pi-v">${num(totalStock)}</div><div class="pi-s">All product stock from API</div></div>
  </div>`;
  const b=document.getElementById('prod-boost-wrap');if(b)b.innerHTML=summary+productTable(winners,'Scale করার মতো winning product পাওয়া যায়নি।');
  const a=document.getElementById('prod-alert-wrap');if(a)a.innerHTML=productTable(protect,'Stock based budget protection alert নেই।');
  const d=document.getElementById('dead-stock-wrap');if(d)d.innerHTML=productTable(dead,'High stock / low demand product পাওয়া যায়নি।');

  const sum=document.getElementById('product-report-summary');if(sum)sum.innerHTML=summary;
  const win=document.getElementById('product-winning-wrap');if(win)win.innerHTML=productTable(winners,'Winning product পাওয়া যায়নি। Campaign name এর সাথে product code match হলে leaderboard দেখাবে।');
  const dec=document.getElementById('product-decision-wrap');if(dec)dec.innerHTML=productTable(enriched.slice(0,30),'Product decision report empty। Products API data পাওয়া যায়নি।');

  renderSizeDemand(enriched);
  renderCreativeRefresh(refresh);
}
function renderSizeDemand(enriched){
  const targets=['size-demand-wrap','product-size-demand-wrap'].map(id=>document.getElementById(id)).filter(Boolean);
  if(!targets.length)return;
  const rows=enriched.filter(x=>x.p.sizes.length).sort((a,b)=>b.perf.purchases-a.perf.purchases||b.p.totalStock-a.p.totalStock).slice(0,12);
  let html='';
  if(!rows.length){
    html='<div class="ltd" style="padding:18px;font-size:12px">Size stock data পাওয়া যায়নি। API response এ size/details না থাকলে এই report empty থাকবে।</div>';
  }else{
    html=rows.map(x=>{
      const max=Math.max(...x.p.sizes.map(s=>s.qty),1);
      const demand=x.perf.purchases>=5?'High demand':x.perf.purchases>=1?'Demand':'No demand';
      return`<div style="padding:12px 14px;border-bottom:1px solid var(--br)">
        <div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:9px;align-items:center"><div>${productMini(x.p)}</div><div style="font-size:11px;color:var(--txm);white-space:nowrap">Orders: <b>${x.perf.purchases||0}</b><br>CPP: <b>${x.perf.cpp?mn(x.perf.cpp):'—'}</b></div></div>
        ${x.p.sizes.map(s=>{const pct=Math.max(4,Math.round(s.qty/max*100));const tag=s.qty<=2?'Re-stock':(x.perf.purchases>=3&&s.qty<=5?'Risk':'OK');const low=s.qty<=2?'low':'ok';return`<div class="demand-grid"><div class="bn" style="text-align:left">${esc(s.name)}</div><div class="bt"><div class="bf" style="width:${pct}%"></div></div><div class="bv ${stockClass(s.qty)}">${s.qty}</div><div class="demand-tag ${low}">${tag}</div></div>`}).join('')}
        <div style="font-size:10px;color:var(--txh);margin-top:6px">${demand} · ${esc(x.decision.reason)}</div>
      </div>`;
    }).join('');
  }
  targets.forEach(wrap=>wrap.innerHTML=html);
}
function renderCreativeRefresh(rows){
  ['creative-refresh-wrap','product-creative-refresh-wrap'].forEach(id=>{
    const wrap=document.getElementById(id);
    if(wrap)wrap.innerHTML=productTable(rows,'Creative refresh alert নেই।');
  });
}
async function renderBestTimeDay() {
  const wrap = document.getElementById(
    'best-time-wrap'
  );

  if (!wrap) return;

  const selectedAccounts =
    typeof getAnalyticsAccounts === 'function'
      ? getAnalyticsAccounts()
      : accounts;

  if (!selectedAccounts.length) {
    wrap.innerHTML =
      '<div class="ltd">No data</div>';

    return;
  }

  const metric =
    document.getElementById('best-time-metric')?.value ||
    'purchases';

  const cacheKey =
    range +
    '|' +
    customStart +
    '|' +
    customEnd +
    '|' +
    metric +
    '|' +
    selectedAccounts.map(account => account.id).join(',');

  if (
    timeReportCacheKey === cacheKey &&
    timeReportCache
  ) {
    drawBestTimeDay(timeReportCache);
    return;
  }

  wrap.innerHTML = `
    <div class="ltd">
      <div class="spin"></div>
      Analysing best time/day…
    </div>
  `;

  const hours = {};
  const days = {};
  const requestParams = dpParams();

  function addData(target, key, row, account) {
    if (!target[key]) {
      target[key] = {
        spend: 0,
        purchases: 0,
        revenue: 0
      };
    }

    const spend = toUSD(
      row.spend,
      account.originalCurrency
    );

    const purchaseAction = fA(row.actions);

    const roas = row.purchase_roas
      ? pf(row.purchase_roas[0]?.value)
      : 0;

    target[key].spend += spend;

    target[key].purchases += purchaseAction
      ? pi(purchaseAction.value)
      : 0;

    target[key].revenue += spend * roas;
  }

  for (const account of selectedAccounts.slice(0, 10)) {
    try {
      const hourlyResponse = await apiFetch(
        '/' + account.id + '/insights',
        {
          fields: 'spend,actions,purchase_roas',
          breakdowns:
            'hourly_stats_aggregated_by_advertiser_time_zone',
          level: 'account',
          limit: 500,
          ...requestParams
        }
      );

      (hourlyResponse.data || []).forEach(row => {
        const hour = pi(
          row.hourly_stats_aggregated_by_advertiser_time_zone
        );

        addData(hours, hour, row, account);
      });
    } catch (error) {
      console.error(
        'Best hour fetch failed:',
        account.name,
        error
      );
    }

    try {
      const dailyResponse = await apiFetch(
        '/' + account.id + '/insights',
        {
          fields: 'spend,actions,purchase_roas',
          time_increment: '1',
          level: 'account',
          limit: 500,
          ...requestParams
        }
      );

      (dailyResponse.data || []).forEach(row => {
        const day = new Date(
          row.date_start
        ).toLocaleDateString('en-US', {
          weekday: 'short'
        });

        addData(days, day, row, account);
      });
    } catch (error) {
      console.error(
        'Best day fetch failed:',
        account.name,
        error
      );
    }
  }

  timeReportCache = {
    hours,
    days,
    metric
  };

  timeReportCacheKey = cacheKey;

  drawBestTimeDay(timeReportCache);
}

function drawBestTimeDay(data) {
  const wrap = document.getElementById(
    'best-time-wrap'
  );

  if (!wrap) return;

  const metric = data.metric || 'purchases';

  function makeRows(source, isHour) {
    return Object.entries(source || {})
      .map(([key, bucket]) => {
        return {
          label: isHour
            ? String(key).padStart(2, '0') + ':00'
            : key,

          value: analyticsMetricValue(
            bucket,
            metric
          ),

          bucket
        };
      })
      .filter(row => {
        if (metric === 'cpp') {
          return row.bucket.purchases > 0;
        }

        return true;
      })
      .sort((a, b) => {
        if (metric === 'cpp') {
          return a.value - b.value;
        }

        return b.value - a.value;
      })
      .slice(0, 5);
  }

  const hourRows = makeRows(
    data.hours,
    true
  );

  const dayRows = makeRows(
    data.days,
    false
  );

  const bestHour = hourRows[0];
  const bestDay = dayRows[0];

  const maximumValue = Math.max(
    ...hourRows.map(row => row.value),
    ...dayRows.map(row => row.value),
    1
  );

  function barWidth(value) {
    if (metric === 'cpp') {
      return Math.max(
        4,
        Math.round(
          (1 - value / maximumValue) * 100
        )
      );
    }

    return Math.max(
      4,
      Math.round(
        (value / maximumValue) * 100
      )
    );
  }

  function buildCard(title, best, rows) {
    return `
      <div class="compare-mini">
        <div class="k">${title}</div>

        <div class="v">
          ${best ? esc(best.label) : '—'}
        </div>

        <div class="sub">
          ${
            best
              ? analyticsMetricLabel(metric) +
                ': ' +
                analyticsMetricFormat(
                  best.value,
                  metric
                )
              : 'No data'
          }
        </div>

        ${rows
          .map(row => {
            return `
              <div
                class="brow"
                style="grid-template-columns:60px 1fr 58px;margin-top:7px;margin-bottom:0"
              >
                <div
                  class="bn"
                  style="text-align:left"
                >
                  ${esc(row.label)}
                </div>

                <div class="bt">
                  <div
                    class="bf"
                    style="width:${barWidth(
                      row.value
                    )}%"
                  ></div>
                </div>

                <div class="bv">
                  ${analyticsMetricFormat(
                    row.value,
                    metric
                  )}
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  }

  wrap.innerHTML = `
    <div class="compare-grid">
      ${buildCard(
        'Best Hour',
        bestHour,
        hourRows
      )}

      ${buildCard(
        'Best Day',
        bestDay,
        dayRows
      )}
    </div>

    <div
      style="font-size:11px;color:var(--txm);margin-top:10px"
    >
      Selected metric:
      ${analyticsMetricLabel(metric)}
      ·
      ${
        metric === 'cpp'
          ? 'Lower is better'
          : 'Higher is better'
      }
    </div>
  `;
}
function renderProductCopyBox(){
  const sel=document.getElementById('prod-copy-select');if(!sel)return;
  if(!prodLoaded){sel.innerHTML='<option value="">Loading products…</option>';loadProducts();return;}
  if(prodErr){sel.innerHTML='<option value="">Products API error</option>';return;}
  const cur=sel.value;
  const opts=products.slice(0,300).map((p,i)=>`<option value="${i}">${esc(p.code?`${p.code} — ${p.name}`:p.name)}</option>`).join('');
  sel.innerHTML=opts||'<option value="">No products found</option>';
  if(cur&&sel.querySelector(`option[value="${cur}"]`))sel.value=cur;
}
async function generateProductAdCopy(){
  const btn=document.getElementById('prod-copy-btn'),out=document.getElementById('prod-copy-output'),sel=document.getElementById('prod-copy-select');
  if(!btn||!out||!sel)return;
  if(!prodLoaded)await loadProducts();
  const p=products[parseInt(sel.value)||0];if(!p){showToast('Product select করুন','w');return;}
  const tone=document.getElementById('prod-copy-tone')?.value||'Premium';
  btn.disabled=true;btn.textContent='⏳ Generating…';out.innerHTML='<div class="spin" style="margin:12px auto"></div>';
  const sizeTxt=p.sizes.map(s=>`${s.name}: ${s.qty}`).join(', ');
  const prompt=`তুমি Alzeena-এর expert Meta Ads copywriter। নিচের product info দিয়ে Facebook/Instagram ad copy বানাও।\n\nProduct: ${p.name}\nCode: ${p.code}\nPrice: ${p.price||p.sellPrice}\nStock by size: ${sizeTxt}\nDetails: ${String(p.details||'').replace(/<[^>]+>/g,' ').slice(0,500)}\nTone: ${tone}\n\nOutput format:\n1) 5টা Primary Text\n2) 5টা Headline\n3) 3টা Description\n4) 3টা Story text\n5) WhatsApp quick reply\n\nবাংলায়, sales-focused কিন্তু natural ভাষায় লিখো।`;
  const reply=await gemini(prompt);
  btn.disabled=false;btn.textContent='Generate';
  if(!reply){out.innerHTML='<div style="color:var(--red);font-size:12px">Gemini key/API সেট করা নেই অথবা response আসেনি।</div>';return;}
  out.innerHTML=`<div style="background:var(--pril);border:1px solid var(--pri);border-radius:var(--rs);padding:14px;font-size:12px;line-height:1.8;color:var(--tx)">${esc(reply).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>')}</div>`;
}
