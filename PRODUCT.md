# Activity Grapher

## Register

product

## Purpose

A personal, single-user web app for logging daily activities and visualizing them as a GitHub-style contribution graph over a full year. The graph is the hero; logging an entry is a one-click-per-day affair. Boards let the same person track parallel streams (e.g. coding, reading, fitness) without mixing them.

## Target users

One person, at their own machine, returning daily. They know what a contribution graph is. They want low-friction logging and an honest picture of consistency over time. Not a team tool, not social, not analytics-heavy.

## Brand personality

Calm, instrumental, trustworthy. Reads like a well-made developer tool (Linear / GitHub / Raycast territory), not a consumer habit-app with streaks and confetti. Numbers are tabular and precise. The interface disappears into the task of logging and reviewing.

## Anti-references

- Not a gamified habit tracker (no streaks, no badges, no confetti, no "you're on fire").
- Not a SaaS dashboard with hero-metrics and gradient accents.
- Not the 2026 cream/sand warm-neutral landing-page aesthetic.
- Not the original "Serializd" dark-only, hard-border, teal-only look — we keep the dashboard shell instead.

## Strategic design principles

1. **The graph is the product.** Everything else frames it. The sidebar, topbar, and panel exist to give the graph context and to make logging next to it frictionless.
2. **Restrained, state-rich.** One neutral surface system with a semantic palette (active/pending/feature/danger). Accent color marks the active board and primary actions only — never decoration.
3. **Per-board identity through color.** Switching boards retints the graph ramp and the active-board dot. Color carries meaning: which stream am I looking at?
4. **Both themes, equal citizens.** Light and dark are both first-class, toggle persisted, respecting `prefers-color-scheme` on first run.
5. **Density without noise.** Tabular numerals, a tight type scale, consistent control vocabulary. Familiarity is the goal; the tool should feel like a tool a fluent user trusts.
6. **Single-file ship, clean source.** Authored in separated `src/` files for navigability; built into one self-contained `form.html`.

## Stack

Client-side only. Single HTML file (built from `src/`). `@hsablonniere/activity-graph` web component for the graph. `js-yaml` for serialization. Storage via the File System Access API (monthly `YYYY-MM.data.yaml` files under a `data/` directory). No build runtime — a tiny `build.mjs` inlines source into `form.html`.

## Surfaces

- `form.html` — the app (year graph, sidebar boards, day-entry panel, stats, export, year jumper, theme toggle).
- `index.html` — read-only preview of the current default board for the current month (kept in sync with the new tokens).
