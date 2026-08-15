#!/usr/bin/env node
/**
 * build.mjs — inline src/ into a single self-contained form.html.
 *   node build.mjs        → writes form.html
 *   node build.mjs --watch → rebuild on src/ change
 */
import { readFileSync, writeFileSync, watch } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = dirname(fileURLToPath(import.meta.url));
const src = (f) => readFileSync(join(root, 'src', f), 'utf8');

function build() {
  const tokens = src('tokens.css');
  const ui = src('ui.css');
  const vfs = src('vfs.js');
  const app = src('app.js');

  const html = `<!doctype html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8" />
  <title>Activity Grapher</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <meta name="description" content="Log daily activities and visualize them as a year-long contribution graph." />
  <!-- web component + YAML parser -->
  <script type="module" src="https://cdn.jsdelivr.net/npm/@hsablonniere/activity-graph/+esm"></script>
  <script src="https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
  <style>
/* ===== tokens ===== */
${tokens}

/* ===== ui ===== */
${ui}
  </style>
</head>
<body>
  <div class="shell">
    <!-- SIDEBAR -->
    <aside class="surface sidebar">
      <div class="brand"><span class="logo">◆</span> Activity</div>

      <div>
        <div class="group-label"><span class="ring"></span>Boards</div>
        <nav class="nav" id="boardNav" aria-label="Boards"></nav>
        <button class="btn ghost" id="renameBtn" style="margin-top:8px;width:100%;justify-content:center;font-size:12px;color:var(--text-secondary)">＋ New / rename board</button>
      </div>

      <div>
        <div class="group-label">Year</div>
        <select class="select" id="yearJump" style="width:100%" aria-label="Year">
          <option>2026</option><option>2025</option><option>2024</option><option>2023</option>
        </select>
      </div>

      <div class="sidebar-foot">
        <div class="theme-toggle">
          <span class="label">Theme</span>
          <span class="seg" role="group" aria-label="Theme">
            <button data-t="light" title="Light theme">☀</button>
            <button data-t="dark" title="Dark theme">☾</button>
          </span>
        </div>
        <p class="storage-note" id="storageNote">Data is stored locally in your browser via the File System Access API.</p>
      </div>
    </aside>

    <!-- MAIN -->
    <section class="surface main">
      <div class="topbar">
        <div class="topbar-title">
          <span class="board-name" id="tbBoard">default</span>
          <span class="sub" id="tbYear">2026 yearly tracker</span>
        </div>
        <div class="topbar-actions">
          <button class="btn icon" id="dateJumpBtn" title="Jump to a date" aria-label="Jump to a date">📆</button>
          <button class="btn" id="exportBtn">Export YAML</button>
        </div>
      </div>

      <div class="content">
        <div class="page-head">
          <div>
            <h1>Year of activity</h1>
            <div class="meta">
              <span class="stat-pill"><b id="statTotal">0</b> completed</span>
              <span class="stat-pill"><b id="statActive">0</b> active days</span>
              <span class="chip green" id="boardChip">default</span>
            </div>
          </div>
          <div class="chips">
            <span class="chip">Mon–Sun</span>
            <span class="chip">Monthly files</span>
          </div>
        </div>

        <div class="surface graph-card">
          <div class="graph-scroll">
            <activity-graph id="graph" class="ag" start-date="2026-01-01" end-date="2026-12-31" weekday-headers="short" month-headers="short" month-limits="early"></activity-graph>
          </div>
          <div class="graph-legend">
            <span>Click any day to log an activity</span>
            <span class="legend-scale" id="legendScale"></span>
          </div>
        </div>

        <div class="surface panel-card" id="sidePanel">
          <div class="panel-head">
            <h2>What happened on <span id="panelDay">today</span>?</h2>
            <span class="date-chip" id="dateChip">—</span>
          </div>
          <div class="entry-form">
            <input class="input" id="entryInput" maxlength="128" placeholder="Describe an activity (Enter to add)…" aria-label="Activity description" />
            <button class="btn primary" id="addBtn">Add activity</button>
            <button class="btn danger" id="delAll" style="display:none">Clear day</button>
          </div>
          <ul class="entry-list" id="entryList"></ul>
        </div>
      </div>
    </section>
  </div>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>

  <script>
/* ===== vfs ===== */
${vfs}
  </script>
  <script>
/* ===== app ===== */
${app}
  </script>
</body>
</html>
`;

  writeFileSync(join(root, 'form.html'), html);
  console.log('✓ built form.html (' + html.length + ' bytes)');
}

build();
if (process.argv.includes('--watch')) {
  watch(join(root, 'src'), { recursive: true }, () => build());
  console.log('watching src/…');
}