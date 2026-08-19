/* ============================================================================
   app.js — Activity Grapher application logic (Layout A)
   Depends on: window.VFS (vfs.js), js-yaml, @hsablonniere/activity-graph.
   No optional chaining (tree-sitter grammar limitation); equivalent checks.
   ========================================================================== */

(() => {
  const $ = (q, r) => (r || document).querySelector(q);
  const $$ = (q, r) => Array.prototype.slice.call((r || document).querySelectorAll(q));
  const fmt = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const ymFile = (date) => date.slice(0, 7) + '.data.yaml';

  // missing or true → done; only explicit false → open (migration: old entries default done)
  const isDone = (e) => e.done !== false;

  // board accent token + ramp prefix
  const BOARD_COLORS = {
    default: 'var(--board-default)',
    coding: 'var(--board-coding)',
    reading: 'var(--board-reading)',
    fitness: 'var(--board-fitness)',
  };

  let curBoard = 'default';
  let curYear = new Date().getFullYear();
  let curSelected = fmt(new Date());
  let graph, prevCell, ready;

  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(.22,1,.36,1)';

  /** Animate a tabular number from its current value to `to`. Snaps under reduced motion. */
  function countUp(el, to, dur) {
    if (!el) return;
    const from = parseInt(el.textContent, 10) || 0;
    if (from === to || reduceMotion()) {
      el.textContent = String(to);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - (1 - p) ** 3;
      el.textContent = String(Math.round(from + (to - from) * e));
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = String(to);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- helpers ---------- */
  function toast(msg, kind) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.toggle('error', kind === 'error');
    t.classList.add('show');
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // known boards own a ramp + chip class; unknown boards fall back to default
  const KNOWN_BOARDS = ['default', 'coding', 'reading', 'fitness'];
  const BOARD_CHIP = { default: 'green', coding: 'blue', reading: 'amber', fitness: 'red' };
  const rampPrefix = (b) => (KNOWN_BOARDS.indexOf(b) !== -1 ? b : 'default');

  /** Map the active board's ramp onto --lvl0..--lvl6 on the graph element. */
  function applyBoardRamp() {
    if (!graph) return;
    const p = rampPrefix(curBoard);
    for (let i = 0; i <= 6; i++) {
      graph.style.setProperty('--lvl' + i, 'var(--' + p + '-' + i + ')');
    }
    // legend swatches follow the active board's ramp (DOM-built, no innerHTML)
    const legend = $('#legendScale');
    if (legend) {
      legend.replaceChildren(document.createTextNode('Less '));
      [0, 2, 4, 6].forEach((l) => {
        const sw = document.createElement('i');
        sw.style.background = 'var(--lvl' + l + ')';
        legend.appendChild(sw);
      });
      legend.appendChild(document.createTextNode(' More'));
      // 'Open' legend swatch for days with uncompleted todos
      const openSw = document.createElement('i');
      openSw.style.background = 'repeating-linear-gradient(45deg, var(--lvl0), var(--lvl0) 2px, var(--text-tertiary) 2px, var(--text-tertiary) 3px)';
      openSw.style.marginLeft = '12px';
      legend.appendChild(openSw);
      legend.appendChild(document.createTextNode(' Open'));
    }
  }

  /* ---------- boards ---------- */
  async function refreshBoards() {
    // gather board names across all months of the current year
    const names = new Set(['default']);
    for (let m = 0; m < 12; m++) {
      const f = curYear + '-' + String(m + 1).padStart(2, '0') + '.data.yaml';
      const db = await VFS.fetch(f);
      for (const k in db) names.add(k);
    }
    const list = Array.from(names);
    const nav = $('#boardNav');
    nav.replaceChildren();
    list.forEach((b) => {
      const a = document.createElement('a');
      a.className = 'nav-item' + (b === curBoard ? ' active' : '');
      a.setAttribute('data-board', b);
      a.setAttribute('tabindex', '0');
      a.setAttribute('role', 'button');
      const lead = document.createElement('span');
      lead.className = 'lead';
      const dot = document.createElement('span');
      dot.className = 'dot';
      dot.style.background = BOARD_COLORS[b] || BOARD_COLORS.default;
      lead.appendChild(dot);
      lead.appendChild(document.createTextNode(b));
      a.appendChild(lead);
      const select = () => {
        curBoard = b;
        onBoardChange();
      };
      a.addEventListener('click', select);
      a.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select();
        }
      });
      nav.appendChild(a);
    });
    syncTopbar();
  }

  async function onBoardChange() {
    applyBoardRamp();
    await refreshBoards();
    await renderGraph(true);
    await renderPanel();
  }

  function syncTopbar() {
    const nm = $('#tbBoard');
    if (nm) nm.textContent = curBoard;
    const sub = $('#tbYear');
    if (sub) sub.textContent = curYear + ' yearly tracker';
    const yj = $('#yearJump');
    if (yj) yj.value = String(curYear);
    // board identity chip: retint to the board's color
    const chip = $('#boardChip');
    if (chip) {
      chip.textContent = curBoard;
      chip.className = 'chip ' + (BOARD_CHIP[curBoard] || 'green');
    }
  }

  /* ---------- graph ---------- */
  async function renderGraph(animate) {
    if (!graph || !ready) return;
    // load all months of the current year, merge
    const merged = {};
    let total = 0,
      active = 0;
    for (let m = 0; m < 12; m++) {
      const f = curYear + '-' + String(m + 1).padStart(2, '0') + '.data.yaml';
      const db = await VFS.fetch(f);
      const bd = db[curBoard] || {};
      for (const date in bd) {
        const done = bd[date].filter(isDone).length;
        if (done) {
          merged[date] = { parts: ['day--data-' + Math.min(done, 6)], title: done + ' of ' + bd[date].length + ' completed' };
          total += done;
          active++;
        } else if (bd[date].length) {
          merged[date] = { parts: ['day--todos'], title: '0 of ' + bd[date].length + ' completed' };
        }
      }
    }
    graph.data = merged;
    if (animate && !reduceMotion()) {
      countUp($('#statTotal'), total, 240);
      countUp($('#statActive'), active, 240);
    } else {
      $('#statTotal').textContent = String(total);
      $('#statActive').textContent = String(active);
    }
    requestAnimationFrame(highlightSelected);
  }

  function highlightSelected() {
    if (prevCell) {
      const p = prevCell.getAttribute('part') || '';
      prevCell.setAttribute(
        'part',
        p
          .split(' ')
          .filter((x) => x !== 'selected')
          .join(' '),
      );
    }
    const sr = graph && graph.shadowRoot;
    const cell = sr ? sr.querySelector('[data-date="' + curSelected + '"]') : null;
    if (cell) {
      const p = cell.getAttribute('part') || 'day';
      cell.setAttribute('part', p + ' selected');
      prevCell = cell;
    }
  }

  /* ---------- panel ---------- */
  async function renderPanel() {
    const day = $('#panelDay');
    const chip = $('#dateChip');
    const d = new Date(curSelected + 'T00:00:00');
    if (day) day.textContent = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    if (chip) chip.textContent = curSelected;

    const db = await VFS.fetch(ymFile(curSelected));
    const list = (db[curBoard] || {})[curSelected] || [];
    const ul = $('#entryList');
    ul.replaceChildren();
    if (list.length) {
      list.forEach((e, i) => {
        const li = document.createElement('li');
        if (isDone(e)) li.classList.add('done');

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'cb';
        cb.checked = isDone(e);
        cb.setAttribute('aria-label', 'Mark complete');
        cb.addEventListener('change', () => toggleDone(i));

        const idx = document.createElement('span');
        idx.className = 'idx';
        idx.textContent = String(i + 1);
        const txt = document.createElement('span');
        txt.className = 'txt';
        txt.textContent = e.description;
        const del = document.createElement('button');
        del.className = 'del';
        del.title = 'Delete entry';
        del.setAttribute('aria-label', 'Delete entry');
        del.textContent = '✕';
        del.addEventListener('click', () => deleteEntry(i));
        li.appendChild(cb);
        li.appendChild(idx);
        li.appendChild(txt);
        li.appendChild(del);
        ul.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'Nothing logged for ' + d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) + ' yet. Add the first activity above.';
      ul.appendChild(li);
    }
    const delAll = $('#delAll');
    if (delAll) delAll.style.display = list.length ? '' : 'none';
  }

  async function toggleDone(i) {
    const f = ymFile(curSelected);
    const db = await VFS.fetch(f);
    const arr = (db[curBoard] || {})[curSelected] || [];
    if (!arr[i]) return;
    arr[i].done = !isDone(arr[i]);
    try {
      await VFS.save(f, db);
    } catch {
      toast('Could not save', 'error');
      return;
    }
    await renderPanel();
    await renderGraph();
    requestAnimationFrame(() => {
      highlightSelected();
      requestAnimationFrame(() => {
        const cell = prevCell;
        if (cell && !reduceMotion()) {
          cell.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.16)' }, { transform: 'scale(1)' }], { duration: 260, easing: EASE });
        }
      });
    });
  }

  async function addEntry() {
    const input = $('#entryInput');
    const txt = input.value.trim();
    if (!txt) {
      toast('Type an activity first', 'error');
      input.focus();
      return;
    }
    if (txt.length > 128) {
      toast('Keep it under 128 characters', 'error');
      return;
    }
    const f = ymFile(curSelected);
    const db = await VFS.fetch(f);
    db[curBoard] = db[curBoard] || {};
    db[curBoard][curSelected] = db[curBoard][curSelected] || [];
    db[curBoard][curSelected].push({ description: txt, done: false });
    try {
      await VFS.save(f, db);
    } catch {
      toast('Could not save', 'error');
      return;
    }
    input.value = '';
    await renderPanel();
    await renderGraph();
    // quiet acknowledgement: the day that just received an activity settles
    requestAnimationFrame(() => {
      highlightSelected();
      requestAnimationFrame(() => {
        const cell = prevCell;
        if (cell && !reduceMotion()) {
          cell.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.16)' }, { transform: 'scale(1)' }], { duration: 260, easing: EASE });
        }
      });
    });
    toast('Activity added');
  }

  async function deleteEntry(i) {
    const ul = $('#entryList');
    const li = ul.children[i];
    if (li && !reduceMotion()) {
      try {
        await li.animate(
          [
            { opacity: 1, transform: 'translateX(0) scale(1)' },
            { opacity: 0, transform: 'translateX(10px) scale(.96)' },
          ],
          { duration: 150, easing: EASE, fill: 'forwards' },
        ).finished;
      } catch {}
    }
    const f = ymFile(curSelected);
    const db = await VFS.fetch(f);
    const arr = (db[curBoard] || {})[curSelected] || [];
    arr.splice(i, 1);
    if (arr.length === 0) delete db[curBoard][curSelected];
    try {
      await VFS.save(f, db);
    } catch {
      toast('Could not save', 'error');
      return;
    }
    await renderPanel();
    await renderGraph();
    toast('Entry deleted');
  }

  async function clearDay() {
    const ul = $('#entryList');
    if (ul.children.length && !reduceMotion()) {
      const anims = $$('#entryList li').map(
        (row) =>
          row.animate(
            [
              { opacity: 1, transform: 'translateX(0)' },
              { opacity: 0, transform: 'translateX(10px)' },
            ],
            { duration: 140, easing: EASE, fill: 'forwards' },
          ).finished,
      );
      try {
        await Promise.all(anims);
      } catch {}
    }
    const f = ymFile(curSelected);
    const db = await VFS.fetch(f);
    if (db[curBoard]) delete db[curBoard][curSelected];
    try {
      await VFS.save(f, db);
    } catch {
      toast('Could not save', 'error');
      return;
    }
    await renderPanel();
    await renderGraph();
    toast('Day cleared');
  }

  /* ---------- export ---------- */
  async function exportYAML() {
    // export the whole current year for the current board
    const out = {};
    out[curBoard] = {};
    for (let m = 0; m < 12; m++) {
      const f = curYear + '-' + String(m + 1).padStart(2, '0') + '.data.yaml';
      const db = await VFS.fetch(f);
      const bd = db[curBoard] || {};
      for (const date in bd) out[curBoard][date] = bd[date];
    }
    const yaml = jsyaml.dump(out, { defaultFlowStyle: false, lineWidth: -1 });
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = curBoard + '-' + curYear + '.data.yaml';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Exported ' + curBoard + ' ' + curYear);
  }

  /* ---------- rename / new board ---------- */
  async function renameBoard() {
    const n = prompt('New board name (or type a new one to create):', curBoard);
    if (!n || n === curBoard) return;
    if (!/^[a-z0-9 _-]{1,32}$/i.test(n)) {
      toast('Use letters, numbers, spaces, - or _', 'error');
      return;
    }
    // migrate across the year
    for (let m = 0; m < 12; m++) {
      const f = curYear + '-' + String(m + 1).padStart(2, '0') + '.data.yaml';
      const db = await VFS.fetch(f);
      if (db[curBoard]) {
        db[n] = db[curBoard];
        delete db[curBoard];
        await VFS.save(f, db);
      }
    }
    curBoard = n;
    await onBoardChange();
    toast('Board renamed');
  }

  /* ---------- year jumper ---------- */
  async function jumpYear(year) {
    curYear = year;
    // clamp selected date into the chosen year (same month/day if valid, else Jan 1)
    const d = new Date(curSelected + 'T00:00:00');
    d.setFullYear(year);
    const cand = fmt(d);
    curSelected = cand;
    syncTopbar();
    await refreshBoards();
    await renderGraph(true);
    await renderPanel();
  }

  /* ---------- theme ---------- */
  function initTheme() {
    const set = (t) => {
      document.documentElement.setAttribute('data-theme', t);
      $$('.theme-toggle .seg button').forEach((b) => {
        b.classList.toggle('on', b.getAttribute('data-t') === t);
      });
      try {
        localStorage.setItem('ag-theme', t);
      } catch {}
    };
    let initial = 'light';
    try {
      const saved = localStorage.getItem('ag-theme');
      initial = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } catch {}
    set(initial);
    $$('.theme-toggle .seg button').forEach((b) => {
      b.addEventListener('click', () => {
        if (!reduceMotion()) {
          const r = document.documentElement;
          r.classList.add('theme-anim');
          setTimeout(() => r.classList.remove('theme-anim'), 260);
        }
        set(b.getAttribute('data-t'));
      });
    });
  }

  /* ---------- wiring ---------- */
  function wireGraph() {
    graph = $('#graph');
    if (!graph) return;
    graph.addEventListener('click', (e) => {
      const el = e.composedPath()[0];
      if (!el || !el.dataset || !el.dataset.date) return;
      curSelected = el.dataset.date;
      highlightSelected();
      renderPanel();
    });
  }

  function wireForm() {
    $('#addBtn').addEventListener('click', addEntry);
    $('#entryInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addEntry();
    });
    $('#delAll').addEventListener('click', clearDay);
    $('#renameBtn').addEventListener('click', renameBoard);
    $('#exportBtn').addEventListener('click', exportYAML);
    const pickBtn = $('#pickFolderBtn');
    if (pickBtn) pickBtn.addEventListener('click', pickFolder);
    $('#yearJump').addEventListener('change', (e) => {
      const y = parseInt(e.target.value, 10);
      if (!isNaN(y)) jumpYear(y);
    });
    $('#dateJumpBtn').addEventListener('click', () => {
      const d = prompt('Jump to a date (YYYY-MM-DD):', curSelected);
      if (!d) return;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        toast('Use YYYY-MM-DD', 'error');
        return;
      }
      const dt = new Date(d + 'T00:00:00');
      if (isNaN(dt)) {
        toast('Invalid date', 'error');
        return;
      }
      curYear = dt.getFullYear();
      curSelected = d;
      syncTopbar();
      refreshBoards().then(renderGraph).then(renderPanel);
    });
  }

  /* ---------- storage note ---------- */
  async function checkStorage() {
    const note = $('#storageNote');
    const btn = $('#pickFolderBtn');
    if (!note) return;
    note.classList.remove('error');

    const ready = await VFS.diskReady();
    if (ready) {
      note.textContent = 'Data on disk + OPFS backup.';
      if (btn) btn.style.display = 'none';
      return;
    }

    const hasHandle = await VFS.hasDiskHandle();
    const opfsOk = await VFS.available();
    if (hasHandle) {
      note.textContent = 'Click to reconnect data folder.';
      if (btn) { btn.style.display = ''; btn.textContent = 'Reconnect folder'; }
    } else if (opfsOk) {
      note.textContent = 'OPFS only — choose a folder for disk backup.';
      if (btn) { btn.style.display = ''; btn.textContent = 'Choose data folder'; }
    } else {
      note.classList.add('error');
      note.textContent = 'Storage unavailable — use a Chromium-based browser.';
      if (btn) btn.style.display = 'none';
    }
  }

  async function pickFolder() {
    try {
      const hasHandle = await VFS.hasDiskHandle();
      if (hasHandle) {
        if (!(await VFS.requestDiskPermission())) throw new Error('Permission denied');
      } else {
        await VFS.pickDirectory();
        await VFS.migrateOpfsToDisk();
      }
      toast('Data folder connected');
      location.reload();
    } catch (e) {
      if (e && e.name !== 'AbortError') toast('Could not connect folder', 'error');
    }
  }

  /* ---------- bootstrap ---------- */
  async function boot() {
    initTheme();
    wireForm();
    graph = $('#graph');
    graph.setAttribute('start-date', curYear + '-01-01');
    graph.setAttribute('end-date', curYear + '-12-31');
    syncTopbar();
    applyBoardRamp();
    await checkStorage();
    try {
      await customElements.whenDefined('activity-graph');
    } catch {}
    ready = true;
    wireGraph();
    // ensure current month file exists
    try {
      const f = ymFile(curSelected);
      const db = await VFS.fetch(f);
      if (!db[curBoard]) {
        db[curBoard] = {};
        await VFS.save(f, db);
      }
    } catch {}
    await refreshBoards();
    await renderGraph();
    await renderPanel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
