## HeroQuickFinder Visual Upgrade Plan

Purely stylistic edits to `src/components/HeroQuickFinder.tsx`. No changes to imports, state, `useEffect`, `handleSubmit`, or translation keys. Framer Motion (`motion`) will be added to the existing import surface only as needed for the shine/pulse loops.

### 1. Premium glass container
Replace the form's class string with a richer glass treatment:
- `bg-white/10` (was `bg-white/95`) + `backdrop-blur-2xl`
- Keep `border border-white/30`
- Add layered shadow: `shadow-[var(--shadow-strong),inset_0_1px_1px_rgba(255,255,255,0.4)]`
- Wrap content in a `relative` container and add an absolutely-positioned `::before`-style div with a subtle radial gradient overlay (`bg-[radial-gradient(ellipse_at_top,hsl(var(--secondary)/0.18),transparent_60%)]`) and `pointer-events-none rounded-2xl`
- Switch text color to `text-white` so labels/selects read on the darker glass; muted helpers become `text-white/70`

### 2. Tactile select triggers
Add to each `<SelectTrigger>`:
- `bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40 hover:shadow-[0_0_0_3px_hsl(var(--secondary)/0.2)] transition-all duration-200`
- Labels: change `text-muted-foreground` → `text-white/80`
- Placeholder text inherits via trigger color

### 3. Animated CTA with shine
- Wrap button content's parent (the button itself) with `relative overflow-hidden active:scale-95 transition-transform`
- Add a `motion.span` absolutely positioned inside the button: a thin diagonal white gradient bar (`bg-gradient-to-r from-transparent via-white/40 to-transparent w-1/3 h-full skew-x-12`) animated with `animate={{ x: ['-150%', '250%'] }}` and `transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}`
- `pointer-events-none` on the shine; keep the existing arrow `group-hover:translate-x-0.5`

### 4. Footer polish
- Wrap the `Sparkles` icon in a `motion.span` with a slow scale + opacity loop (`animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}`, `duration: 2.4, repeat: Infinity`) — falls back gracefully under reduced motion via Framer Motion's defaults
- Update footer text colors: `text-white/70` for the tagline, link becomes `text-secondary hover:text-white`

### Out of scope
- No changes to logic, props, fetches, routing, translation strings, or labels
- No new files, no new dependencies (framer-motion already in project)

### Files touched
- `src/components/HeroQuickFinder.tsx` (single file, class + small JSX additions)
