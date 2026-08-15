# UI backlog

Carried over from the removed `ui-ideas.md`. Items already implemented in the redesign are struck through. The remaining ones are candidates for a future polish pass.

## Done (implemented in the redesign)

- ~~:active scale(0.97) press feedback on buttons~~
- ~~Custom cubic-bezier ease-out on transitions~~
- ~~Toast translateY enter/exit~~
- ~~prefers-reduced-motion media query~~
- ~~Stagger animation on entry list items~~
- ~~focus-visible styles on inputs/selects/buttons~~
- ~~Storage errors surfaced via toast (plus sidebar status note)~~

## Remaining

- [ ] **Tooltip redesign**: skip-delay on subsequent hovers, origin-aware positioning, avoid per-mouseover DOM creation (the naive tooltip script creates a span on every mouseover).
- [ ] **Gate day-cell hover scale** behind `@media (hover: hover) and (pointer: fine)` so touch devices don't get stuck hover states.
- [ ] **Animate day-cell selection transition** so the highlight ring doesn't snap in.
- [ ] **Replace native `prompt()` for rename/new board** with an inline edit UI in the sidebar.
- [ ] **Reduce day-cell hover scale** from 1.3 toward a subtler value.
- [ ] **`@starting-style` for toast entry** instead of a class toggle (for entry-from-hidden animation).
- [ ] **Animate graph cell data-level color transitions** when entries change (intensity ramp morphs on add/delete).
