## Problem

In the Course of Study card, level-2 rows (e.g. "Mathematics, Natural Sciences", "Agricultural and Forest Sci…") render their label and the count pill outside / clipped against the card's right edge. The count pill (`0`, `58`) sits on top of, or past, the card border, and the accordion chevron pushes things further right.

Root cause is in `src/components/search/HierarchicalFieldSelect.tsx`:

1. The parent `AccordionItem` row uses `pl-3` / `pl-6` for indentation but has **no right padding**, so the right edge of its inner flex children touches the card border. The `CountPill` then visually hugs / overlaps the border.
2. Inside the `AccordionTrigger`, the inner flex wrapper has `pr-2` *and* the trigger itself renders a chevron via `[&>svg]:ml-1.5` — so the real content width is `card − pl − chevron − pr`, but the count pill is placed *before* the chevron with no guaranteed gap, and the label's `truncate` is competing against the pill for space.
3. Leaf rows use `pr-2` which is tighter than the parent card's body padding (`px-3`), making leaf pills sit closer to the edge than parent pills.
4. `FilterCardSection` body is `px-3 pb-3` — fine, but combined with the row's own `pl-6` at level 3, the usable inner width gets very narrow at the deepest level, which is why "Agricultural and Forest Sci…" truncates aggressively while the `0` pill still appears clipped.

## Fix (single file: `src/components/search/HierarchicalFieldSelect.tsx`)

Goal: guarantee the count pill always sits **inside** the card with a consistent right gutter, and let the label truncate cleanly before it ever collides with the pill or the chevron.

1. **Add a consistent right padding to every row** (both leaf and parent):
   - Leaf row container: change `py-1.5 pr-2` → `py-1.5 pr-3`.
   - Parent row container: add `pr-2` to the outer flex wrapper so the row never reaches the card edge.
   - This gives every row the same right gutter as the card's `px-3` body.

2. **Reduce indentation slightly so deep rows keep usable width**:
   - Level 2: `pl-3` → `pl-2`.
   - Level 3: `pl-6` → `pl-4`.
   - Indentation is still visually clear (left accent border remains), but the inner content area is wider, so labels like "Agricultural and Forest Sciences" can show more characters before truncating.

3. **Fix the parent-row chevron / pill collision**:
   - On the `AccordionTrigger`, change `pr-2` (on the inner wrapper) → `pr-1`, and change `[&>svg]:ml-1.5` → `[&>svg]:ml-2` so the chevron has breathing room from the pill.
   - Wrap the label + pill in a flex with `gap-2` (currently `gap-2` exists but the pill has no guaranteed left margin from the truncated label — add `ml-auto` to `CountPill` wrapper or keep `shrink-0` and ensure the label is `min-w-0 flex-1 truncate` so the pill is pushed right but never clipped).

4. **Ensure overflow never clips the pill**:
   - Remove `overflow-hidden` from the row containers (it's what causes the pill to be visually cut when it briefly overflows during layout). Keep `min-w-0 w-full` so flex truncation still works on the label.
   - The card itself (`FilterCardSection` `rounded-2xl … overflow-hidden`) already clips anything that would escape the card, so removing `overflow-hidden` on the inner row is safe and prevents the pill from being chopped mid-character.

5. **Tighten `CountPill` placement**:
   - Add `ml-2` to `CountPill` usage in both leaf and parent rows so there's always a visible gap between the (possibly truncated) label and the pill.

## Out of scope

- No changes to `FilterCardSection.tsx`, `FilterSidebar.tsx`, or any business logic.
- No change to count values, selection logic, or accordion behavior.

## Result

- "Mathematics, Natural Sciences" and "Agricultural and Forest Sciences" rows show the count pill fully inside the card with a clean right gutter.
- Labels truncate with an ellipsis *before* touching the pill, and the chevron on parent rows no longer crowds the pill.
- All nesting levels (1, 2, 3) share the same right gutter so pills align vertically down the card.
