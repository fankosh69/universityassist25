## Goal

Rebuild the search-page filter sidebar to match the selected direction ("High-density accent stack" with subtle elevation on expand) and definitively fix the Course of Study overflow where labels and count pills collide with the card edge.

## What changes (frontend only)

### 1. `FilterSidebar.tsx` — sidebar shell
- Sidebar header row: "Filters" in Space Grotesk bold + small "Clear all" link in primary (#2E57F6).
- Keep the search input but restyle: white bg, `border-[#e8ecf1]`, `rounded-xl`, leading search icon, focus ring `#2E57F6/20`.
- Stack of filter cards with `gap-3`.

### 2. `FilterCardSection.tsx` — unified card pattern (used by EVERY category)
Every filter (Course of Study, Location, Degree Type, Tuition Fees, Institution Type, Institution Ownership, Duration) renders through this single component. Header structure:

```text
[ icon-tile ]  Label .................... [ count-chip ] [ chevron ]
```

- Card: `bg-white border-[#e8ecf1] rounded-2xl shadow-sm`.
- Expanded state adds the elevation shift the user picked: `shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] ring-1 ring-black/5` and primary-tinted icon tile (`bg-[#2E57F6]/5 text-[#2E57F6]`).
- Collapsed state: muted icon tile (`bg-[#94a3b8]/10 text-[#94a3b8]`) and `hover:border-[#2E57F6]/30`.
- Count chip only renders when active selections > 0: filled `bg-[#2E57F6] text-white` pill.
- Smooth chevron rotation + content fade/expand transition.
- Each category gets its own lucide icon (GraduationCap, MapPin, Award, Wallet, Building2, Landmark, Clock).

### 3. `HierarchicalFieldSelect.tsx` — definitive row overflow fix
Replace the current AccordionTrigger-based row with a flat grid row that guarantees containment:

```text
row = [ checkbox 16px ] [ label flex-1 min-w-0 truncate ] [ count chip shrink-0 ] [ chevron 12px shrink-0 ]
```

Concrete rules applied to every level (parents and leaves):
- Outer row: `flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-[#fafbfc]`.
- Left cluster: `flex items-center gap-3 min-w-0` so flex shrinking works.
- Label: `truncate text-sm font-medium`.
- Count chip: `shrink-0 text-[10px] font-bold bg-[#e8ecf1] text-[#64748b] px-1.5 py-0.5 rounded-full min-w-[28px] text-center` (selected: `bg-[#2E57F6]/10 text-[#2E57F6]`).
- Expand chevron (parents only): rendered manually inside the row, `w-3 h-3 shrink-0`, rotates on open.
- Drop `overflow-hidden` from row wrappers; the card already clips and `truncate` does the work.
- Indentation: level 2 = `pl-2`, level 3 = `pl-4`, kept tight so the right gutter always has room for the chip.

### 4. Same row pattern applied to all simple list filters
Location options, Degree Type, Institution Type, Institution Ownership, Duration variants use the same checkbox + truncated label + count chip pattern so the sidebar reads as one consistent system.

### 5. Tokens
Match the locked palette literally where the design uses them (`#2E57F6`, `#fafbfc`, `#e8ecf1`, `#94a3b8`, `#0f172a`, `#475569`, `#64748b`) so the implementation visually equals the prototype. Fonts: Space Grotesk for headings/labels, DM Sans for body — already wired in the project.

## Out of scope

- No changes to filter business logic, data sources, counts, sorting, or how selections propagate.
- No edits to program cards or the page header.
- No new dependencies.

## Verification

- Open `/search`, expand Course of Study, confirm long Level 2 / Level 3 labels truncate with ellipsis and the count chip stays fully inside the card.
- Check collapsed vs expanded card states: expanded card shows the elevation + primary-tinted icon tile.
- Spot-check Location, Degree Type, Tuition Fees, Institution Type, Institution Ownership, Duration — all share the same header pattern and row pattern.
