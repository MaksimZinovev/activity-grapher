# DESIGN.md — Activity Grapher

Visual source of truth. Built from the `design/github-dashboard` export, adapted to a product (app) register with light + dark themes and per-board color identity.

## Theme

Two equal themes, toggle persisted in `localStorage` (`ag-theme`), defaulting to `prefers-color-scheme` on first run. Light is a near-white canvas with white surfaces and soft borders. Dark is a low-glare neutral with layered surfaces. Both use OKLCH-minded neutrals tinted slightly cool, with a single semantic accent system.

## Color tokens

### Neutrals (light / dark)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--canvas` | `#f2f2f0` | `#0d0f12` | page background |
| `--surface` | `#ffffff` | `#15171a` | cards, sidebar, main |
| `--surface-muted` | `#fafaf9` | `#1b1e22` | hover, sinks, chips |
| `--surface-sunk` | `#f4f4f2` | `#121417` | inset/graph bg |
| `--border` | `#ececea` | `#2a2f35` | default borders |
| `--border-strong` | `#e2e2df` | `#353a41` | control borders |
| `--text-primary` | `#0a0a0a` | `#f4f4f4` | body, headings |
| `--text-secondary` | `#6b6b6b` | `#a0a4a8` | labels, meta |
| `--text-tertiary` | `#9a9a95` | `#6b6f73` | placeholders, captions |

### Semantic

| Token | Light | Dark | Use |
|---|---|---|---|
| `--active-bg/fg` | `#e6f4ea` / `#1f8a4c` | `rgba(52,168,83,.16)` / `#4ade80` | positive, default board |
| `--pending-bg/fg` | `#fff6d6` / `#9a7b12` | `rgba(232,162,58,.16)` / `#f0c674` | reading board, warning |
| `--feature-bg/fg` | `#dcebff` / `#2f66c9` | `rgba(47,102,201,.18)` / `#7da7f5` | coding board, info |
| `--danger-bg/fg` | `#fdecec` / `#c0392b` | `rgba(217,74,61,.16)` / `#f87171` | fitness board, destructive |
| `--accent` | `#2f66c9` | `#5a8ded` | primary actions, selection ring |
| `--accent-2` | `#5a8ded` | `#7da7f5` | logo gradient end |

### Per-board graph ramps

Each board owns a 6-level intensity ramp (`--b0`…`--b6`) for empty→max, defined for both themes. The active board's ramp is mapped onto `--lvl0`…`--lvl6` at runtime so the graph retints on board switch.

- **default** → green (`#34a853` family)
- **coding** → blue (`#2f66c9` family)
- **reading** → amber (`#e8a23a` family)
- **fitness** → red (`#d94a3d` family)

## Typography

One family: `Geist, Inter, system-ui, -apple-system, "Segoe UI", sans-serif`. Tabular numerals (`font-feature-settings: "tnum","lnum"`) everywhere numbers appear. Fixed rem scale (not fluid), ratio ~1.15:

- h1: 1.5rem / 600 / -.01em / `text-wrap: balance`
- h2: 1.05rem / 600
- body: 14px / 1.5
- small/label: 13px / 500
- micro/eyebrow: 11px / 600 / .04em / uppercase (used sparingly: group labels only)

## Spacing / radius / shadow / motion

- Spacing base 4px; card padding 20–22px; content 24/28/32.
- Radii: card `16px`, tile `12px`, control `8px`, pill `999px`.
- Shadows: `--shadow` (subtle 1px), `--shadow-lg` (6–10px soft).
- Motion: `--ease` = `cubic-bezier(.22,1,.36,1)`; transitions 150–200ms; reduced-motion instant.

## Components

Every interactive control ships default / hover / focus / active / disabled states. Focus ring: `0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent)`.

- **Shell**: `256px 1fr` grid, collapses to single column < 860px. Sidebar sticky on desktop.
- **Sidebar**: brand, Boards group (nav items with colored dot + count), New/rename board, Year jumper, theme toggle, storage note.
- **Topbar**: current board · year, date-jump, Export YAML.
- **Page head**: h1 + live stats (entries, active days) + context chips.
- **Graph card**: `activity-graph` web component in a horizontally-scrolling surface, with a Less/More legend.
- **Entry panel**: selected-day heading + date chip, inline add form (input + Add activity + Clear day), numbered entry list with per-item delete, teaching empty state.
- **Toast**: bottom-right pill, 200ms ease, auto-dismiss 2s.
- **Controls**: `.btn` (default/primary/ghost/icon/danger), `.input`, `.select` — one vocabulary everywhere.

## States to implement

default, hover, focus, active, disabled, loading (skeleton for graph while files load), empty (no entries / no boards), error (storage init failure, parse failure), success (toast on add/delete/rename/export).

## Responsive

Structural breakpoints: < 860px sidebar collapses above content; < 600px topbar controls compact, panel form stacks vertically. No horizontal overflow at 360×800 → 1920×1080. Graph scrolls horizontally inside its card on narrow viewports.

## Accessibility

Headings hierarchical, controls are real buttons/inputs/selects, focus states visible, graph days keyboard-reachable where the component supports it, color contrast ≥ 4.5:1 for body text in both themes.
