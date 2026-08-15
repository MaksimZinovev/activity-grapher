# Plan: Todo Mode for Activity Grapher

## Summary

Transform activities from pure log entries into todo items: newly added items start **incomplete**, the user checks them off to **complete** them, and only completed items are reflected on the contribution graph. Days where all todos remain open get a distinct hatched appearance.

## Scope

**Only** `src/app.js` + `src/ui.css` + `build.mjs` (HTML template) → rebuild `form.html`.
`index.html` is a separate standalone page with its own inline script — **not touched**. Document this in docs later.

## Ponytail alignment

Ponytail = laziest solution that actually works. This plan follows the ladder:

1. **YAGNI** — Feature explicitly requested; not speculative.
2. **Reuse existing code** — `toggleDone` mirrors `addEntry`/`deleteEntry` pattern (fetch→modify→save→render→animate). Settle pulse animation reused from `addEntry`, not re-written. `countUp` reused. Legend DOM-build pattern reused from `applyBoardRamp`.
3. **Stdlib** — `Array.filter` for counting completed. No utility library.
4. **Native platform** — `<input type="checkbox">` over a custom toggle component. CSS `repeating-linear-gradient` for hatching. `accent-color` for theming. `text-decoration: line-through` for done items. All native, zero new dependencies.
5. **No new dependencies** — The `activity-graph` web component already supports the `parts` array mechanism. No new npm packages.
6. **One-liner where possible** — `isDone` is a single expression. `renderGraph` branch logic is the minimum for three cell states.
7. **Minimum diff** — 4 files touched, all additive changes to existing functions. No new files, no new abstractions, no extracted helpers for two call sites.

Skipped: shared `saveAndRender()` helper (would abstract `fetch→save→render→animate` used by `addEntry`, `toggleDone`, `deleteEntry`, `clearDay` — but that's 4 call sites with minor variations; premature until a 5th arrives). Skipped: per-board strict/inclusive toggle (Q4 alt — adds a settings concept the app doesn't have).

---

## Locked Decisions (16/16)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Data model | `done: true\|false` field on each entry |
| 2 | Migration | Old entries (no `done` field) default to `done: true` |
| 3 | Complete UI | Checkbox on each list item |
| 4 | Reflection rule | Only completed items count toward graph intensity |
| 5 | All-incomplete visual | Custom cell part `day--todos` (hatched/striped) |
| 6 | Mixed day (done + open) | Show completed intensity only; open invisible on graph |
| 7 | Stats | Count only completed items / active days (match graph) |
| 8 | Un-complete | Checkbox toggles freely both ways |
| 9 | Panel order | Insertion order (unchanged) |
| 10 | New item default state | Starts open (`done: false`) |
| 11 | Clear day | Wipe ALL entries (unchanged) |
| 12 | Export/import | `done` optional; missing = `true` (matches migration) |
| 13 | Cell tooltip | `"N of M completed"` |
| 14 | Legend | Add hatched `Open` swatch |
| 15 | Complete animation | Reuse settle pulse (scale 1→1.16→1) |
| 16 | View scope | `src/` → `form.html` only |

---

## Implementation

### 1. Data model — `src/app.js`

**Helper function** — normalize `done` with the migration rule (missing = true):

```js
const isDone = (e) => e.done !== false;  // missing or true → done; only explicit false → open
```

This single rule covers migration (Q2), export round-trip (Q12), and all rendering logic.

**`addEntry()`** — change the pushed object:

```js
// before
db[curBoard][curSelected].push({ description: txt });
// after
db[curBoard][curSelected].push({ description: txt, done: false });
```

### 2. Graph rendering — `src/app.js` → `renderGraph()`

Current logic (line ~160):

```js
merged[date] = { parts: ['day--data-' + Math.min(bd[date].length, 6)], title: bd[date].length + ' activit...' };
total += bd[date].length;
active++;
```

New logic — count completed only, detect all-incomplete days:

```js
const done = bd[date].filter(isDone).length;
if (done) {
  merged[date] = { parts: ['day--data-' + Math.min(done, 6)], title: done + ' of ' + bd[date].length + ' completed' };
  total += done;
  active++;
} else if (bd[date].length) {
  merged[date] = { parts: ['day--todos'], title: '0 of ' + bd[date].length + ' completed' };
}
// else: no entries → cell stays default (lvl0, not in merged)
```

### 3. Day panel — `src/app.js` → `renderPanel()`

Add a checkbox to each `<li>`. Current rendering (line ~210):

```js
const li = document.createElement('li');
const idx = document.createElement('span');
idx.className = 'idx';
idx.textContent = String(i + 1);
const txt = document.createElement('span');
txt.className = 'txt';
txt.textContent = e.description;
const del = document.createElement('button');
// ...
```

New — insert checkbox before the index span:

```js
const li = document.createElement('li');
if (isDone(e)) li.classList.add('done');

const cb = document.createElement('input');
cb.type = 'checkbox';
cb.className = 'cb';
cb.checked = isDone(e);
cb.setAttribute('aria-label', 'Mark complete');
cb.addEventListener('change', () => toggleDone(i));

const idx = document.createElement('span');
// ... (unchanged)
```

**New function** `toggleDone(i)`:

```js
async function toggleDone(i) {
  const f = ymFile(curSelected);
  const db = await VFS.fetch(f);
  const arr = (db[curBoard] || {})[curSelected] || [];
  if (!arr[i]) return;
  arr[i].done = !isDone(arr[i]);  // toggle: if currently done → set false; if open → set true
  try {
    await VFS.save(f, db);
  } catch {
    toast('Could not save', 'error');
    return;
  }
  await renderPanel();
  await renderGraph();
  // reuse settle pulse on the graph cell
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
```

### 4. CSS — `src/ui.css`

**Cell part for all-incomplete days** (after the `day--data-6` rule, line ~246):

```css
activity-graph.ag::part(day--todos) {
  background: repeating-linear-gradient(45deg,
    var(--lvl0), var(--lvl0) 3px,
    var(--text-tertiary) 3px, var(--text-tertiary) 4px);
}
```

**Checkbox + done-item styling** (in the `.entry-list li` section, ~line 258):

```css
.entry-list li .cb {
  width: 16px; height: 16px; flex: none;
  accent-color: var(--accent);
  cursor: pointer;
}
.entry-list li.done .txt {
  text-decoration: line-through;
  color: var(--text-tertiary);
}
```

**Legend** — add an 'Open' swatch. In `applyBoardRamp()` (app.js, line ~72), after the `More` text:

```js
// append the 'Open' legend entry
const openLabel = document.createElement('span');
openLabel.style.marginLeft = '12px';
openLabel.appendChild(document.createTextNode(' '));
const openSw = document.createElement('i');
openSw.style.background = 'repeating-linear-gradient(45deg, var(--lvl0), var(--lvl0) 2px, var(--text-tertiary) 2px, var(--text-tertiary) 3px)';
openLabel.appendChild(openSw);
openLabel.appendChild(document.createTextNode(' Open'));
legend.appendChild(openLabel);
```

### 5. Stats labels — `build.mjs` (HTML template)

The stat pills currently say "entries" and "active days". Since stats now count completed items only, update labels for clarity:

```html
<!-- before -->
<span class="stat-pill"><b id="statTotal">0</b> entries</span>
<span class="stat-pill"><b id="statActive">0</b> active days</span>
<!-- after -->
<span class="stat-pill"><b id="statTotal">0</b> completed</span>
<span class="stat-pill"><b id="statActive">0</b> active days</span>
```

### 6. Build

Run `node build.mjs` to regenerate `form.html` from the updated `src/` files.

---

## Files changed

| File | Change |
|------|--------|
| `src/app.js` | `isDone` helper, `addEntry` default, `renderGraph` logic, `renderPanel` checkbox, new `toggleDone`, legend swatch in `applyBoardRamp` |
| `src/ui.css` | `day--todos` part, checkbox `.cb` style, `.done` strikethrough |
| `build.mjs` | Stat pill label "entries" → "completed" |
| `form.html` | Regenerated by `node build.mjs` |

## Files NOT changed

| File | Reason |
|------|--------|
| `index.html` | Separate standalone view, out of scope (Q16) |
| `src/vfs.js` | Storage layer unaffected |
| `src/tokens.css` | No new design tokens needed |

---

## Acceptance criteria

All of the following must pass before the task is claimed complete:

1. **Old data with no `done` field** — `isDone()` returns `true` → graph unchanged (Q2)
2. **Day with 0 entries** — not in `merged` → default `lvl0` cell (unchanged)
3. **Day with all open todos** — cell renders `day--todos` hatched part (Q5)
4. **Day with mix of done + open** — cell renders `day--data-N` where N = completed count only (Q6)
5. **Un-complete** — toggling checkbox back to open removes item from graph, cell reverts (Q8)
6. **Clear day** — wipes all entries regardless of done state (Q11)
7. **Export** — `done` field included in YAML dump; re-import tolerates missing field (Q12)
8. **New item** — starts as open (`done: false`), not reflected on graph until checked (Q10)
9. **Checkbox toggle** — checking sets done, unchecking re-opens, both animate the graph cell (Q3, Q8, Q15)
10. **Stats** — topbar counts only completed items and active days with completed items (Q7)
11. **Tooltip** — cell title shows "N of M completed" (Q13)
12. **Legend** — hatched 'Open' swatch visible next to color ramp (Q14)

---

## Implementation order

1. Add `isDone` helper + update `addEntry` default
2. Rewrite `renderGraph` completed-count logic
3. Add `toggleDone` function + checkbox in `renderPanel`
4. CSS: `day--todos` part, checkbox styles, done strikethrough
5. Legend: add 'Open' swatch in `applyBoardRamp`
6. Update stat label in `build.mjs`
7. `node build.mjs` → regenerate `form.html`
8. Test in browser at `http://localhost:8000/form.html`
