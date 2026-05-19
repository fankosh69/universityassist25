## Why the live version looks weaker than the prototype

The "Smart Hybrid Hub" prototype was a **standalone card** with its own chrome:

- rounded-2xl card, soft blue shadow, padded sections
- header row: icon tile (blue-50 bg) + bold "Location" + active count pill + chevron
- "POPULAR CITIES" eyebrow + chip row
- rounded search input with focus ring
- results list with rounded-xl rows, blue tinted active row, "X Programs" pill, ghosted empty-state rows
- footer action bar with "Clear Filter"

In the implementation I dropped `CityLocationFilter` **inside** the existing `FilterGroup` accordion, so:

1. The prototype's custom header is replaced by the generic FilterGroup row (small icon tile, no count pill, no chevron treatment).
2. The card frame / footer bar disappear (the whole sidebar is one card, not per-filter).
3. The popular-city chip fallback hardcodes "Berlin / Munich / Hamburg / Cologne / Frankfurt" and filters out anything with `programCount === 0` — for many catalogs the chips render empty.
4. On the current viewport the open accordion shows almost no content (likely the popular-cities row is gone, search + list are squeezed by `lg:p-4` + accordion padding, and the list is collapsed by `max-h-72` minus other paddings). It just looks blank.
5. The Course of Study pills were tightened but the surrounding FilterGroup chrome is still the old, plainer style — visually inconsistent with what we promised.

## Plan

### 1. Lift CityLocationFilter to a self-contained card section

Stop nesting it under `FilterGroup`. In `FilterSidebar.tsx`, replace the Location `<FilterGroup>` block with the standalone card layout from the prototype:

- outer wrapper: `rounded-2xl border border-border bg-card shadow-sm`
- header: 9x9 `bg-primary/10` icon tile + Space Grotesk title + active-count badge (when city ≠ all) + chevron toggle
- collapsible body (controlled by local `open` state, default expanded if `city !== 'all'`)
- footer bar: subtle top border, centered "Clear filter" button (only when active)

This restores all the chrome the prototype had without breaking the other accordion items.

### 2. Fix the popular-cities fallback

Inside `CityLocationFilter`:

- keep the curated `DEFAULT_POPULAR` list, but if fewer than 3 match (after the `programCount > 0` filter), top up from the cities sorted by `programCount desc` until we have up to 5 chips.
- always show the eyebrow row when at least 1 chip resolves; hide cleanly when none.

### 3. Match prototype item styling

In `CityLocationFilter`:

- active row: `bg-primary/5 border-primary/30` with `Check` icon on the left and a `"<n> Programs"` pill on the right (full word, like the prototype) instead of just a number.
- available row: subtle hover (`hover:bg-muted/50`), neutral number pill that turns primary-tinted on hover.
- zero-programs row: opacity 60, 2x2 muted dot instead of the pill, subtitle "No programs yet".
- bump row vertical padding to match the prototype's `p-3`, keep `space-y-1`.

### 4. Apply the same card treatment to Course of Study

For visual consistency (Course of Study and Location are the two heaviest filters), wrap the `HierarchicalFieldSelect` in the same standalone card shell (header tile + title + active count badge + chevron + footer "Clear" when items selected). The internal list already has the truncating pill from the previous pass — just need the outer chrome to match.

Leave the lighter filters (Degree Type, Tuition, Duration, etc.) inside the existing `FilterGroup` accordion. The result: a two-tier hierarchy where the two "hero" filters feel like prototype cards and the rest stay compact.

### 5. Verify

After implementing, re-open `/search`, expand Location and Course of Study, and confirm:

- chips render (with fallback to top cities by count)
- active city shows blue tinted row + "X Programs" pill
- footer "Clear filter" appears when a city is selected
- Course of Study card mirrors the Location card chrome
- no empty/blank state when expanded

### Files touched

- `src/components/search/FilterSidebar.tsx` — replace Location and Course of Study `FilterGroup` blocks with new card sections; remove the small wrapper bug that left the open accordion empty.
- `src/components/search/CityLocationFilter.tsx` — popular-cities fallback, item styling parity, active "X Programs" pill.
- (new) `src/components/search/FilterCardSection.tsx` — small shared card shell (header + collapsible body + footer) used by both Location and Course of Study to avoid duplication.

No backend/data changes. Pure presentation work, scoped to the search filter sidebar.