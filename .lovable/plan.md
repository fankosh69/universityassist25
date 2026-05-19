# Unify filter sidebar styling

## Goal
Every filter category (Degree, Tuition, Institution, Ownership, Duration, Application Method, Application Fee, Intake, Deadline, English Proof, My German GPA, Prerequisites) should use the same `FilterCardSection` card chrome as Course of Study and Location. Also fix Course of Study where nested rows/pills visually break out of the card frame.

## Changes

### 1. `src/components/search/FilterSidebar.tsx`
- Remove the `<Accordion>` + `FilterGroup` block entirely.
- Drop unused imports (`Accordion`, `FilterGroup`).
- Render every category as a `FilterCardSection` inside one unified `space-y-3 p-4` container, so the sidebar becomes a single vertical stack of identical cards (no more mixed accordion + card styles).
- For each card, pass:
  - `title`, matching `icon` (size bumped to `h-5 w-5` to match the hero cards),
  - `activeCount` computed exactly as today,
  - `onClear` + `clearLabel` so every card gets the same footer "Clear filter" affordance when active,
  - `defaultOpen={false}` (cards auto-open when they have an active value via the component's existing logic).
- Keep the same control inside each card (RadioGroup / Select / Checkbox group / Slider / DeadlineRangeFilter / HierarchicalFieldSelect / CityLocationFilter) — only the wrapper changes.
- Remove the top-level `Filters` header `Clear all` redundancy is kept (still useful as a global reset).

### 2. `src/components/search/HierarchicalFieldSelect.tsx` — contain content inside the card
The overflow comes from nested levels: level-2 uses `ml-4`, level-3 uses `ml-8`, plus a left border. Inside the tight `px-4` body of `FilterCardSection`, the deepest rows push into / past the card edge and the count pills get clipped.

Fix:
- Wrap the rendered tree in `min-w-0 w-full` and add `overflow-hidden` to each row container so nothing escapes horizontally.
- Replace the absolute `ml-4` / `ml-8` indentation with `pl-3` / `pl-6` on the row itself (padding instead of margin) so the row's right edge stays flush with the card and only the inner content shifts.
- Move the decorative left border to a `before:` pseudo-element / inset border so it sits inside the row's padding rather than pushing layout outward.
- On the leaf row, ensure the label uses `min-w-0 flex-1` and the `CountPill` keeps `shrink-0`; tighten `gap` so long names like "Mathematics, Natural Sciences" truncate cleanly instead of wrapping under the pill.
- Reduce the search input + "X selected / Clear" row paddings so they align with the card's `px-4` body (currently they bleed slightly because of the accordion's inner styling).

### 3. `src/components/search/FilterCardSection.tsx` — minor polish so dense content fits
- Change body padding from `px-4 pb-4 -mt-1` to `px-3 pb-3 -mt-1` so nested checkbox/accordion children have an extra few px of breathing room on each side (prevents the same overflow on Course of Study).
- Add `min-w-0` to the body wrapper.
- No API change; existing call sites keep working.

## Out of scope
- No data/business-logic changes.
- No changes to filter behavior, defaults, or active-count math.
- `FilterGroup.tsx` stays in the repo (other places may still import it) but is no longer used by the sidebar.

## Result
- Sidebar becomes a single, consistent stack of rounded card sections — Course of Study and Location no longer feel like a different design language from the rest.
- Course of Study tree stays fully inside its card at every nesting level, with pills aligned to the card's right edge and long labels truncating.
