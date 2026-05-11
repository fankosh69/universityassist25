## HeroQuickFinder Interactive Upgrade

Replace `src/components/HeroQuickFinder.tsx` with the enhanced version. All required shadcn deps (`command`, `popover`, `badge`) already exist in the project, so no install is needed.

### What ships
1. **Searchable Field combobox** — `Popover` + `Command` with `CommandInput` for typeahead across all Level-2 fields.
2. **Iconified labels** — `GraduationCap` (level), `BookOpen` (field), `Globe` (language).
3. **Contextual tip** — `AnimatePresence` swap based on `level × language` matrix.
4. **Trending preset chips** — One-tap fill + 250ms delayed navigate, with active-state checkmark.
5. **Smart CTA** — When all 3 fields are non-default: gradient bg, shadow glow, infinite shimmer sweep (motion span).
6. **Dirty/Reset** — Reset button appears only when state diverges from defaults.
7. **`/` keyboard shortcut** — Smooth-scroll + focus first trigger; ignores typing in inputs.
8. **Entry animation** — Card fades + slides up; top border has infinite gradient sweep.
9. **Preserves**: existing Supabase fetch, i18n keys, `handleSubmit` URL params, eligibility-checker link.

### Preset slugs (corrected to real DB values)
Verified against `fields_of_study` (level=2). The user's draft used non-existent slugs like `engineering`, `business`, `data-science`. Replace with:
```
Mechanical Eng. → mechanical-engineering
Business Admin → business-administration
Medicine → medicine
Computer Science → computer-science
Electrical Eng. → electrical-engineering
```
(Drop "Data Science" — not in DB; "Electrical Engineering" is a high-intent substitute.)

### Visual integration with prior glass design
Keep the previous premium glass look from the last iteration:
- Form container: `bg-white/10 backdrop-blur-2xl`, white text, radial overlay, inset highlight shadow.
- Select/Combobox triggers: `bg-white/10 border-white/20 text-white hover:bg-white/20`.
- Tip + footer copy: `text-white/80` / `text-white/70`; eligibility link uses `text-secondary`.
- Preset chips below the card sit on the hero bg, so use the user's lighter style (`bg-white/80 backdrop-blur` inactive, `bg-primary text-primary-foreground` active) — that contrast still works.
- Keyboard hint pill: `bg-white/10 text-white/70 border-white/20`.

### Animations
- Card mount: `initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}`.
- Top gradient line: absolutely positioned 1px bar with `bg-gradient-to-r from-transparent via-secondary to-transparent`, animated `backgroundPosition` or translate loop (4s).
- Smart-CTA shimmer: reuses prior `motion.span` shine (only when `allFieldsSet`).
- Tip swap: `AnimatePresence` mode="wait", fade+y 6px, 0.25s.
- Preset hover/tap: `whileHover={{ scale:1.05, y:-2 }}`, `whileTap={{ scale:0.95 }}`.
- Active preset checkmark: `motion.span` scale-in.

### Accessibility
- All triggers keep `id` + `<Label htmlFor>`.
- `/` shortcut bails when focus is in INPUT/TEXTAREA/SELECT/contentEditable.
- Combobox uses `role="combobox"` (provided by shadcn Command pattern) with `aria-expanded`.
- Reduced-motion: motion components inherit Framer Motion's reduced-motion behavior; shimmer is decorative (`aria-hidden`).

### Files touched
- `src/components/HeroQuickFinder.tsx` — full rewrite per spec above.

### Out of scope
- No new dependencies, no shadcn install, no changes to other components, no business-logic changes.
