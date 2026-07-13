// DATE PICKER
// ═══════════════════════════════════════
function dpOpen() {
  document.getElementById('dp-ov').classList.add('open');

  const trig = document.getElementById('dp-trig');
  const rect = trig.getBoundingClientRect();
  const pnl = document.getElementById('dp-pnl');

  let top = rect.bottom + 5;
  let left = rect.left;

  if (left + 700 > window.innerWidth) left = window.innerWidth - 710;
  if (left < 6) left = 6;

  pnl.style.top = top + 'px';
  pnl.style.left = left + 'px';

  document
    .querySelectorAll('.dp-pi')
    .forEach(button => button.classList.remove('on'));

  document.getElementById('pre-' + range)?.classList.add('on');

  dpCust = range === 'custom';
  dpPend = null;

  const selectedRange = dpRngDate(range);
  dpS = selectedRange.s;
  dpE = selectedRange.e;

  const base = dpS || new Date();

  dpLY = base.getFullYear();
  dpLM = base.getMonth();

  dpRY = dpLY;
  dpRM = dpLM + 1;

  if (dpRM > 11) {
    dpRM = 0;
    dpRY++;
  }

  dpUpdInps();
  dpRenderCals();
  dpUpdateApplyState();
}

function dpClose() {
  document.getElementById('dp-ov').classList.remove('open');
}

function dpPre(r, lbl) {
  document
    .querySelectorAll('.dp-pi')
    .forEach(button => button.classList.remove('on'));

  document.getElementById('pre-' + r)?.classList.add('on');

  dpCust = false;
  dpPend = { r, lbl };

  const selectedRange = dpRngDate(r);

  dpS = selectedRange.s;
  dpE = selectedRange.e;

  dpUpdInps();
  dpRenderCals();
  dpUpdateApplyState();
}

function dpCustom() {
  document
    .querySelectorAll('.dp-pi')
    .forEach(button => button.classList.remove('on'));

  document.getElementById('pre-custom')?.classList.add('on');

  dpCust = true;
  dpPend = null;

  if (customStart && customEnd) {
    dpS = dpParseISO(customStart);
    dpE = dpParseISO(customEnd);
  } else {
    dpS = null;
    dpE = null;
  }

  dpHov = null;

  dpUpdInps();
  dpRenderCals();
  dpUpdateApplyState();
}

function dpApply() {
  if (dpPend) {
    range = dpPend.r;
    rangeLbl = dpPend.lbl;

    customStart = null;
    customEnd = null;

    localStorage.removeItem('mads_custom_start');
    localStorage.removeItem('mads_custom_end');

    dpUpdTrigger();
    dpClose();
    loadAll();
    return;
  }

  if (dpCust && dpS && dpE) {
    range = 'custom';

    customStart = dpISO(dpS);
    customEnd = dpISO(dpE);

    localStorage.setItem('mads_custom_start', customStart);
    localStorage.setItem('mads_custom_end', customEnd);

    rangeLbl = dpFmtD(dpS) + ' – ' + dpFmtD(dpE);

    dpUpdTrigger();
    dpClose();
    loadAll();
    return;
  }
}

function dpUpdTrigger() {
  let lbl = rangeLbl;

  if (range === 'custom' && customStart && customEnd) {
    lbl =
      dpFmtD(dpParseISO(customStart)) +
      ' – ' +
      dpFmtD(dpParseISO(customEnd));
  } else {
    const selectedRange = dpRngDate(range);
    const start = selectedRange.s;
    const end = selectedRange.e;

    if (start && end && dpISO(start) === dpISO(end)) {
      lbl = rangeLbl + ': ' + dpFmtD(start);
    } else if (start && end) {
      lbl = rangeLbl + ': ' + dpFmtD(start) + ' – ' + dpFmtD(end);
    }
  }

  document.getElementById('dp-lbl').textContent = lbl;
  localStorage.setItem(RG, range);
}

function dpRngDate(preset) {
  if (preset === 'custom' && customStart && customEnd) {
    return {
      s: dpParseISO(customStart),
      e: dpParseISO(customEnd)
    };
  }

  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  let start = new Date(today);
  let end = new Date(today);

  if (preset === 'yesterday') {
    start.setDate(start.getDate() - 1);
    end = new Date(start);
  } else if (preset === 'last_7d') {
    start.setDate(start.getDate() - 6);
  } else if (preset === 'last_14d') {
    start.setDate(start.getDate() - 13);
  } else if (preset === 'last_28d') {
    start.setDate(start.getDate() - 27);
  } else if (preset === 'last_30d') {
    start.setDate(start.getDate() - 29);
  } else if (preset === 'this_week') {
    start.setDate(start.getDate() - start.getDay());
  } else if (preset === 'last_week') {
    start.setDate(start.getDate() - start.getDay() - 7);
    end = new Date(start);
    end.setDate(end.getDate() + 6);
  } else if (preset === 'this_month') {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
  } else if (preset === 'last_month') {
    start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    end = new Date(today.getFullYear(), today.getMonth(), 0);
  } else if (preset === 'this_quarter') {
    const quarter = Math.floor(today.getMonth() / 3);
    start = new Date(today.getFullYear(), quarter * 3, 1);
  } else if (preset === 'this_year') {
    start = new Date(today.getFullYear(), 0, 1);
  } else if (preset === 'maximum') {
    start = new Date(2015, 0, 1);
  }

  return {
    s: start,
    e: end
  };
}

function dpISO(date) {
  return (
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0')
  );
}

function dpParseISO(value) {
  const parts = String(value || '')
    .split('-')
    .map(Number);

  return new Date(
    parts[0] || new Date().getFullYear(),
    (parts[1] || 1) - 1,
    parts[2] || 1
  );
}

function dpFmtD(date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function dpUpdInps() {
  document.getElementById('dp-s').value = dpS ? dpFmtD(dpS) : '';
  document.getElementById('dp-e').value = dpE ? dpFmtD(dpE) : '';
}

function dpRenderCals() {
  dpRenderOne('dp-cl', dpLY, dpLM, true);
  dpRenderOne('dp-cr', dpRY, dpRM, false);
}

function dpRenderOne(id, year, month, isLeft) {
  const element = document.getElementById(id);

  const monthOptions = MONTHS.map(
    (name, index) =>
      `<option value="${index}" ${
        index === month ? 'selected' : ''
      }>${name}</option>`
  ).join('');

  const yearOptions = [];
  const maximumYear = new Date().getFullYear() + 2;

  for (let yearNumber = 2015; yearNumber <= maximumYear; yearNumber++) {
    yearOptions.push(
      `<option value="${yearNumber}" ${
        yearNumber === year ? 'selected' : ''
      }>${yearNumber}</option>`
    );
  }

  let html = `
    <div class="dp-cal-hd">
      ${
        isLeft
          ? `<button class="dp-nav" onclick="dpNav(-1)">&#8249;</button>`
          : '<div></div>'
      }

      <div class="dp-cal-title">
        <select onchange="dpSM('${id}', this.value)">
          ${monthOptions}
        </select>

        <select onchange="dpSY('${id}', this.value)">
          ${yearOptions.join('')}
        </select>
      </div>

      ${
        !isLeft
          ? `<button class="dp-nav" onclick="dpNav(1)">&#8250;</button>`
          : '<div></div>'
      }
    </div>
  `;

  html += `
    <div class="dp-wds">
      ${WDAYS.map(day => `<div class="dp-wd">${day}</div>`).join('')}
    </div>
  `;

  html += '<div class="dp-days">';

  const firstDay = new Date(year, month, 1);
  const startingWeekday = firstDay.getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayISO = dpISO(today);
  const startISO = dpS ? dpISO(dpS) : null;
  const endISO = dpE ? dpISO(dpE) : null;

  for (let empty = 0; empty < startingWeekday; empty++) {
    html += '<div class="dp-day emp"></div>';
  }

  for (let day = 1; day <= totalDays; day++) {
    const iso =
      year +
      '-' +
      String(month + 1).padStart(2, '0') +
      '-' +
      String(day).padStart(2, '0');

    let className = 'dp-day';

    if (iso === todayISO) {
      className += ' tod';
    }

    if (startISO && endISO && startISO === endISO && iso === startISO) {
      className += ' ss se';
    } else if (iso === startISO) {
      className += ' ss';
    } else if (iso === endISO) {
      className += ' se';
    }

    if (startISO && endISO && iso > startISO && iso < endISO) {
      className += ' inr';
    }

    html += `
      <div
        class="${className}"
        data-iso="${iso}"
        role="button"
        tabindex="0"
        onclick="dpDC('${iso}')"
        onkeydown="if(event.key === 'Enter' || event.key === ' '){event.preventDefault();dpDC('${iso}')}"
      >${day}</div>
    `;
  }

  html += '</div>';
  element.innerHTML = html;
}

function dpDC(iso) {
  dpCust = true;
  dpPend = null;
  dpHov = null;

  document
    .querySelectorAll('.dp-pi')
    .forEach(button => button.classList.remove('on'));

  document.getElementById('pre-custom')?.classList.add('on');

  const parts = iso.split('-');

  const selectedDate = new Date(
    parseInt(parts[0]),
    parseInt(parts[1]) - 1,
    parseInt(parts[2])
  );

  // নতুন range শুরু
  if (!dpS || dpE) {
    dpS = selectedDate;
    dpE = null;
  } else {
    // দ্বিতীয় click: range শেষ
    if (selectedDate < dpS) {
      dpE = new Date(dpS.getTime());
      dpS = new Date(selectedDate.getTime());
    } else {
      dpE = new Date(selectedDate.getTime());
    }
  }

  dpUpdInps();
  dpRenderCals();
  dpUpdateApplyState();
}

function dpSM(id, value) {
  if (id === 'dp-cl') {
    dpLM = parseInt(value);

    if (dpLM === dpRM && dpLY === dpRY) {
      dpRM = dpLM + 1;

      if (dpRM > 11) {
        dpRM = 0;
        dpRY++;
      }
    }
  } else {
    dpRM = parseInt(value);

    if (dpRM === dpLM && dpRY === dpLY) {
      dpLM = dpRM - 1;

      if (dpLM < 0) {
        dpLM = 11;
        dpLY--;
      }
    }
  }

  dpRenderCals();
}

function dpSY(id, value) {
  if (id === 'dp-cl') {
    dpLY = parseInt(value);
  } else {
    dpRY = parseInt(value);
  }

  dpRenderCals();
}

function dpNav(direction) {
  dpLM += direction;

  if (dpLM > 11) {
    dpLM = 0;
    dpLY++;
  }

  if (dpLM < 0) {
    dpLM = 11;
    dpLY--;
  }

  dpRM = dpLM + 1;
  dpRY = dpLY;

  if (dpRM > 11) {
    dpRM = 0;
    dpRY++;
  }

  dpRenderCals();
}

function dpUpdateApplyState() {
  const button = document.getElementById('dp-apply');

  if (!button) return;

  button.disabled = dpCust && (!dpS || !dpE) && !dpPend;
}