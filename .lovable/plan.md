

# Enhance Search Filters — UX/UI Overhaul

Make the filter sidebar cleaner, searchable, and more powerful. Fix mobile tooltip interactions, unify typography in the field-of-study tree, add search to long lists (fields, cities), include all German cities (not just those with programs), and replace the "month checkbox list" deadline filter with a proper date range picker.

## What you'll see

### 1. Course of Study (hierarchical) — cleaner, searchable

- **Search bar at the top** of the field tree. Typing filters all 3 levels in real time, auto-expands matching parents, and highlights the matched text.
- **Unified typography**: every level uses the same body font size and weight. Hierarchy is shown only via:
  - Indentation
  - A thin left border accent (lighter at deeper levels)
  - The expand chevron
- Removed: bold/semibold/larger fonts on Level 1, muted color on Level 3, mixed badge styles. All program-count badges now share one neutral style.
- Selected items use a single subtle highlight (no double-highlighting via background + bold).
- Adds "Clear selection" link inside the group when something is picked.

### 2. Location — full city list with search

- Replaces the basic `Select` with a **searchable combobox** (`SearchableSelect`).
- Source of cities expanded: pull from the `cities` table (all German cities on the platform), not just cities that currently have programs. Each item shows `City — Region` and a small badge with program count (0 allowed; greyed out + disabled or shown with "no programs yet" hint).
- Type-ahead search, keyboard navigation, scrollable.

### 3. Application Deadline — date range slider (replaces month checkboxes)

- A **dual-handle range slider** spanning the next 18 months, with two date pickers showing the current `from` / `to`.
- Quick presets as small chips: "Next 30 days", "Next 3 months", "Before 15 July", "This winter intake", "This summer intake".
- Logic: a program matches if either its winter or summer deadline falls inside `[from, to]`. Replaces the current month-checkbox UI entirely.
- Active state shows e.g. "Deadline between Apr 21 – Jul 15".

### 4. Mobile-friendly disclaimers (the ⓘ buttons)

- Replace `Tooltip` with a **hybrid**: `Tooltip` on desktop (hover), `Popover` on touch devices (tap to open, tap outside to close).
- Implemented as a small reusable `<InfoHint>` component used everywhere a disclaimer ⓘ appears (Tuition "Free", No Application Fee, MOI, etc.).
- Adds proper `aria-label="More information"` for accessibility.

### 5. General polish

- Consistent spacing, consistent label sizing, consistent active-count badge style.
- "Clear All Filters" stays sticky at the bottom; each filter group also gets an inline "Clear" link when active.
- Mobile filter sheet keeps the same layout; widened slightly for the new combobox/slider.

## Technical notes

**Files to edit**
- `src/components/search/FilterSidebar.tsx` — swap city `Select` for `SearchableSelect`; replace deadline checkboxes with new `DeadlineRangeFilter`; replace inline `Tooltip`s with `<InfoHint>`.
- `src/components/search/HierarchicalFieldSelect.tsx` — add internal search state, recursive filter + auto-expand, normalize typography (remove level-based font/weight/color variations), unify badges.
- `src/components/search/EnhancedSearchContainer.tsx` — fetch city list from `cities` table once on mount; change deadline filter shape from `applicationStatus: string[]` (months) to `deadlineRange: { from: string | null; to: string | null }`; update filtering logic accordingly. Keep the field-key clean (rename `applicationStatus` → `deadlineRange`).

**New files**
- `src/components/ui/info-hint.tsx` — `<InfoHint content={...} />` that renders Tooltip on desktop (`hover: hover` media query / non-touch) and Popover on touch via `useIsMobile`.
- `src/components/search/DeadlineRangeFilter.tsx` — wraps shadcn `Slider` (range mode) + two read-only date displays + preset chips. Emits `{ from, to }` ISO date strings.

**Data**
- Cities query: `supabase.from('cities').select('id, name, slug, region').order('name')`. Merge with `program_count` derived from `allPrograms`. RLS already allows public read.
- No DB migration required.

**State migration**
- `applicationStatus: string[]` → `deadlineRange: { from: string | null; to: string | null }`. Default `{ from: null, to: null }`. Filtering: a program matches if winter OR summer deadline parses into a date within `[from, to]` (inclusive). When both are null, the filter is inactive.

**Accessibility & responsive**
- All new interactive elements: visible focus ring, keyboard-operable, `aria-label`s on icon-only buttons. Slider has `aria-valuetext` showing the formatted date.
- Mobile (<768px): InfoHint = Popover; slider thumbs sized for touch (h-6 w-6).

## Out of scope
- No changes to results panel, program cards, or sorting.
- No backend/DB changes.
- Other filter groups (Degree, Tuition, Institution Type, Ownership, Duration, Application Method, Application Fee, Intake, English Language Proof) keep their current controls — only their typography/spacing is normalized to match the new look.

