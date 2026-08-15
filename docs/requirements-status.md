# Requirements Status

Tracks implementation status of requirements from `docs/initial-requirements.md`. Updated after the UI/UX redesign (see `PRODUCT.md`, `DESIGN.md`).

## Implementation Status Summary

### ✅ **COMPLETED (19/19 core)**

| # | Requirement | Notes |
|---|-------------|-------|
| 1 | Self-contained HTML + JS + CSS (single file) | `form.html` is built from `src/` via `build.mjs` into one file |
| 2 | Clean, modern UI | Redesigned around the `design/github-dashboard` system: light + dark themes, sidebar + main shell, per-board colors |
| 3 | 1-year activity graph | Full current-year view; year jumper to browse past years |
| 4 | Form displaying 1-year activity graph | Graph is the hero of the main content area |
| 5 | Current day/cell selected & highlighted by default | Boot selects today (timezone-safe `fmt`) |
| 6 | Graph itself used to select date | Click handlers via `composedPath()` into shadow DOM |
| 7 | Default board selected by default | Sidebar active state + topbar + identity chip |
| 8 | User can select day/cell | Click with outline-ring selection state |
| 9 | User can see added activities when day/cell selected | Entry panel lists activities for the selected date |
| 10 | User can see rendered activity graph on form | Graph re-renders on add/delete with intensity updates |
| 11 | Each activity has "description" field (128 chars max) | Input validation + toast feedback |
| 12 | Each activity can have multiple text fields as entries | Array of entries per day |
| 13 | User can update name of activity graph | New / rename board (migrates across all months of the year) |
| 14 | User can view entry data by hovering over day/cell | Built-in tooltips show activity counts |
| 15 | Basic error handling and validation | Input validation, storage error toasts + sidebar status note |
| 16 | All interactive elements have tooltips | `title` / `aria-label` on controls |
| 17 | Subtle animations for usability | 170ms ease-out-quart transitions, reduced-motion support |
| 18 | Data stored as separate YAML files | File System Access API with `js-yaml` serialization |
| 19 | One YAML file for each month | `YYYY-MM.data.yaml` under an OPFS `data/` directory |

### Previously missing — now implemented

| Item | Status |
|------|--------|
| Graph data loaded from YAML files | ✅ Loads monthly YAML via the File System Access API |
| Multiple activity graphs (boards) | ✅ default, coding, reading, fitness + user-created boards; per-board color ramps |
| Explicit "Add" button | ✅ "Add activity" button alongside Enter-to-submit |

### 📅 **POST-MVP**

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | Multi-browser compatibility | 📅 Post-MVP | Storage uses the File System Access API (Chromium only). A IndexedDB fallback for Firefox/Safari is a future option. |

## Current Architecture

- **Source**: `src/tokens.css`, `src/ui.css`, `src/vfs.js`, `src/app.js` → `build.mjs` → single `form.html`.
- **Storage**: File System Access API (`window.VFS`), monthly `YYYY-MM.data.yaml` files in OPFS.
- **Data structure**: `{ board: { "YYYY-MM-DD": [ { description } ] } }`.
- **Graph**: `@hsablonniere/activity-graph` web component, themed via CSS custom properties and `::part()`.
- **Themes**: light + dark, persisted in `localStorage`, per-board 6-level intensity ramps.
- **Framework**: vanilla JS (no optional chaining; DOM-built, no `innerHTML`).
