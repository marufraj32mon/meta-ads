// ═══════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════

function populateAnalyticsAccountFilter() {
  const select = document.getElementById(
    'analytics-account-filter'
  );

  if (!select) return;

  const current = select.value || 'all';

  select.innerHTML =
    '<option value="all">All selected accounts</option>' +
    accounts
      .map(account => {
        return `
          <option value="${account.id}">
            ${esc(account.name)}
          </option>
        `;
      })
      .join('');

  select.value = accounts.some(account => account.id === current)
    ? current
    : 'all';
}

function getAnalyticsAccounts() {
  const selectedId =
    document.getElementById('analytics-account-filter')?.value ||
    'all';

  if (selectedId === 'all') {
    return accounts;
  }

  return accounts.filter(account => account.id === selectedId);
}

function onAnalyticsFilterChange() {
  timeReportCacheKey = '';
  renderAnalytics();
}

function analyticsMetricValue(bucket, metric) {
  if (metric === 'spend') {
    return bucket.spend || 0;
  }

  if (metric === 'purchases') {
    return bucket.purchases || 0;
  }

  if (metric === 'cpp') {
    return bucket.purchases
      ? bucket.spend / bucket.purchases
      : 0;
  }

  if (metric === 'roas') {
    return bucket.spend
      ? bucket.revenue / bucket.spend
      : 0;
  }

  return 0;
}

function analyticsMetricLabel(metric) {
  const labels = {
    spend: 'Spend ($)',
    purchases: 'Purchases',
    cpp: 'CPP ($)',
    roas: 'ROAS'
  };

  return labels[metric] || metric;
}

function analyticsMetricFormat(value, metric) {
  if (metric === 'spend' || metric === 'cpp') {
    return mn(value);
  }

  if (metric === 'roas') {
    return Number(value || 0).toFixed(2) + 'x';
  }

  return num(value);
}

function previousPeriodParams() {
  const current = dpRngDate(range);

  if (!current.s || !current.e) {
    return null;
  }

  const totalDays =
    Math.round((current.e - current.s) / 86400000) + 1;

  const previousEnd = new Date(current.s);
  previousEnd.setDate(previousEnd.getDate() - 1);

  const previousStart = new Date(previousEnd);
  previousStart.setDate(
    previousStart.getDate() - totalDays + 1
  );

  return {
    'time_range[since]': dpISO(previousStart),
    'time_range[until]': dpISO(previousEnd)
  };
}

async function fetchTrendBuckets(
  selectedAccounts,
  requestParams
) {
  const dateMap = {};

  await Promise.all(
    selectedAccounts.map(async account => {
      try {
        const response = await apiFetch(
          '/' + account.id + '/insights',
          {
            fields: 'spend,actions,purchase_roas',
            time_increment: '1',
            level: 'account',
            limit: 500,
            ...requestParams
          }
        );

        (response.data || []).forEach(row => {
          const date = row.date_start;

          if (!dateMap[date]) {
            dateMap[date] = {
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

          const purchases = purchaseAction
            ? pi(purchaseAction.value)
            : 0;

          const roas = row.purchase_roas
            ? pf(row.purchase_roas[0]?.value)
            : 0;

          dateMap[date].spend += spend;
          dateMap[date].purchases += purchases;
          dateMap[date].revenue += spend * roas;
        });
      } catch (error) {
        console.error(
          'Trend fetch failed:',
          account.name,
          error
        );
      }
    })
  );

  return Object.entries(dateMap).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
}

function renderAnalytics() {
  populateAnalyticsAccountFilter();
  renderTrend();
  renderHeatmap();
  renderBestTimeDay();
  renderPerf();
}

async function renderTrend() {
  const selectedAccounts = getAnalyticsAccounts();

  if (!selectedAccounts.length) return;

  const metric =
    document.getElementById('trend-metric')?.value ||
    'spend';

  const comparePrevious =
    document.getElementById('trend-compare')?.checked ||
    false;

  const currentRows = await fetchTrendBuckets(
    selectedAccounts,
    dpParams()
  );

  let previousRows = [];

  if (comparePrevious) {
    previousRows = await fetchTrendBuckets(
      selectedAccounts,
      previousPeriodParams() || {}
    );
  }

  const labels = currentRows.map(([date]) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  });

  const currentData = currentRows.map(([, bucket]) =>
    analyticsMetricValue(bucket, metric)
  );

  const previousData = previousRows.map(([, bucket]) =>
    analyticsMetricValue(bucket, metric)
  );

  drawTrend(
    labels,
    currentData,
    previousData,
    metric
  );
}

function drawTrend(
  labels,
  currentData,
  previousData,
  metric
) {
  const canvas = document.getElementById('trend-cv');

  if (!canvas) return;

  if (charts.trend) {
    charts.trend.destroy();
    charts.trend = null;
  }

  const textColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--txh')
      .trim() || '#888';

  const gridColor = 'rgba(124,58,237,.08)';

  const datasets = [
    {
      label: 'Current ' + analyticsMetricLabel(metric),
      data: currentData,
      borderColor: '#7c3aed',
      backgroundColor: 'rgba(124,58,237,.1)',
      fill: true,
      tension: 0.35,
      pointRadius: 3
    }
  ];

  if (previousData.length) {
    datasets.push({
      label: 'Previous period',
      data: previousData,
      borderColor: '#9ca3af',
      backgroundColor: 'transparent',
      borderDash: [6, 4],
      tension: 0.35,
      pointRadius: 2
    });
  }

  charts.trend = new Chart(canvas, {
    type: 'line',

    data: {
      labels,
      datasets
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        mode: 'index',
        intersect: false
      },

      plugins: {
        legend: {
          labels: {
            color: textColor,
            font: {
              size: 11
            }
          }
        },

        tooltip: {
          callbacks: {
            label(context) {
              return (
                context.dataset.label +
                ': ' +
                analyticsMetricFormat(
                  context.parsed.y,
                  metric
                )
              );
            }
          }
        }
      },

      scales: {
        x: {
          grid: {
            color: gridColor
          },

          ticks: {
            color: textColor,
            maxTicksLimit: 10
          }
        },

        y: {
          grid: {
            color: gridColor
          },

          ticks: {
            color: textColor,

            callback(value) {
              return analyticsMetricFormat(
                value,
                metric
              );
            }
          }
        }
      }
    }
  });
}

async function renderHeatmap() {
  const wrap = document.getElementById('hm-wrap');
  const selectedAccounts = getAnalyticsAccounts();

  if (!selectedAccounts.length) {
    wrap.innerHTML = '<div class="ltd">No data</div>';
    return;
  }

  const metric =
    document.getElementById('heatmap-metric')?.value ||
    'purchases';

  const buckets = {};

  await Promise.all(
    selectedAccounts.map(async account => {
      try {
        const response = await apiFetch(
          '/' + account.id + '/insights',
          {
            fields: 'spend,actions,purchase_roas',
            breakdowns:
              'hourly_stats_aggregated_by_advertiser_time_zone',
            level: 'account',
            limit: 500,
            ...dpParams()
          }
        );

        (response.data || []).forEach(row => {
          const hour = pi(
            row.hourly_stats_aggregated_by_advertiser_time_zone
          );

          if (!buckets[hour]) {
            buckets[hour] = {
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

          buckets[hour].spend += spend;

          buckets[hour].purchases += purchaseAction
            ? pi(purchaseAction.value)
            : 0;

          buckets[hour].revenue += spend * roas;
        });
      } catch (error) {
        console.error(
          'Heatmap fetch failed:',
          account.name,
          error
        );
      }
    })
  );

  const hours = Array.from(
    { length: 24 },
    (_, index) => index
  );

  const values = hours.map(hour =>
    analyticsMetricValue(
      buckets[hour] || {},
      metric
    )
  );

  const maximumValue = Math.max(...values, 1);

  function getColor(value) {
    const percentage = value / maximumValue;

    if (!percentage) {
      return 'rgba(124,58,237,.06)';
    }

    if (percentage < 0.25) {
      return 'rgba(124,58,237,.2)';
    }

    if (percentage < 0.5) {
      return 'rgba(124,58,237,.45)';
    }

    if (percentage < 0.75) {
      return 'rgba(124,58,237,.7)';
    }

    return 'rgba(124,58,237,.95)';
  }

  const cellWidth = Math.max(
    16,
    Math.floor((wrap.clientWidth - 44) / 24)
  );

  wrap.innerHTML = `
    <div style="margin-left:32px;display:flex;gap:2px;margin-bottom:3px">
      ${hours
        .map(hour => {
          return `
            <div style="width:${cellWidth}px;font-size:9px;color:var(--txh);text-align:center;flex-shrink:0">
              ${hour}
            </div>
          `;
        })
        .join('')}
    </div>

    <div style="display:flex;align-items:center;gap:2px">
      <div style="font-size:9px;color:var(--txh);width:30px;text-align:right">
        All
      </div>

      ${hours
        .map((hour, index) => {
          return `
            <div
              title="${hour}:00 → ${analyticsMetricFormat(
                values[index],
                metric
              )}"
              style="width:${cellWidth}px;height:28px;border-radius:3px;background:${getColor(
                values[index]
              )};flex-shrink:0"
            ></div>
          `;
        })
        .join('')}
    </div>

    <div style="margin-top:8px;font-size:10px;color:var(--txh)">
      Metric: ${analyticsMetricLabel(metric)}
      · Darker = higher
    </div>
  `;
}

function renderPerf() {
  const canvas = document.getElementById('perf-cv');

  if (!canvas) return;

  if (charts.perf) {
    charts.perf.destroy();
    charts.perf = null;
  }

  const selectedAccountIds = new Set(
    getAnalyticsAccounts().map(account => account.id)
  );

  const search =
    (
      document.getElementById('perf-search')?.value ||
      ''
    ).toLowerCase();

  const status =
    document.getElementById('perf-status')?.value ||
    '';

  const minimumSpend = pf(
    document.getElementById('perf-min-spend')?.value
  );

  const filteredCampaigns = campaigns
    .filter(campaign => {
      if (!selectedAccountIds.has(campaign.accountId)) {
        return false;
      }

      if (campaign.spend < minimumSpend) {
        return false;
      }

      if (status && campaign.status !== status) {
        return false;
      }

      if (
        search &&
        !campaign.name.toLowerCase().includes(search)
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 100);

  if (!filteredCampaigns.length) return;

  const maxCPP =
    pf(document.getElementById('tc')?.value) || 5;

  const minROAS =
    pf(document.getElementById('troas')?.value) || 2;

  const maximumSpend = Math.max(
    ...filteredCampaigns.map(campaign => campaign.spend),
    1
  );

  const points = filteredCampaigns.map(campaign => {
    return {
      x: campaign.cpp || 0,
      y: campaign.roas || 0,

      r: Math.max(
        4,
        Math.min(
          18,
          4 +
            Math.sqrt(
              campaign.spend / maximumSpend
            ) *
              14
        )
      ),

      campaign
    };
  });

  const colors = filteredCampaigns.map(campaign => {
    if (!campaign.purchases) {
      return 'rgba(139,139,136,.55)';
    }

    if (
      campaign.cpp <= maxCPP &&
      campaign.roas >= minROAS
    ) {
      return 'rgba(62,207,142,.78)';
    }

    return 'rgba(247,85,85,.75)';
  });

  const textColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--txh')
      .trim() || '#888';

  const gridColor = 'rgba(124,58,237,.08)';

  charts.perf = new Chart(canvas, {
    type: 'bubble',

    data: {
      datasets: [
        {
          label: 'Campaigns',
          data: points,
          backgroundColor: colors,
          borderColor: colors
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false
        },

        tooltip: {
          callbacks: {
            label(context) {
              const campaign =
                context.raw.campaign;

              return [
                campaign.name,
                `Account: ${campaign.accountName}`,
                `Spend: ${mn(campaign.spend)}`,
                `Purchases: ${campaign.purchases || 0}`,
                `CPP: ${
                  campaign.cpp
                    ? mn(campaign.cpp)
                    : '—'
                }`,
                `ROAS: ${
                  campaign.roas
                    ? campaign.roas.toFixed(2) + 'x'
                    : '—'
                }`
              ];
            }
          }
        }
      },

      scales: {
        x: {
          title: {
            display: true,
            text: 'CPP ($) — lower is better',
            color: textColor
          },

          grid: {
            color: gridColor
          },

          ticks: {
            color: textColor,

            callback(value) {
              return '$' + value;
            }
          }
        },

        y: {
          title: {
            display: true,
            text: 'ROAS — higher is better',
            color: textColor
          },

          grid: {
            color: gridColor
          },

          ticks: {
            color: textColor,

            callback(value) {
              return value + 'x';
            }
          }
        }
      }
    }
  });
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
