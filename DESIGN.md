# GLAMO Nepal — Design System

## Register

**brand** — Design IS the product. Follow brand.md from impeccable. Avoid all AI slop patterns (repeated labels, numbered lists, gradient text, glassmorphism, identical card grids).

## Color Strategy

**Committed** — One saturated color (primary rose #D97898) carries 30-50% of the surface. Neutrals are tinted warm. Gold/secondary (#B88967 / #C4A35A) is the accent at ≤10%.

### Palette

| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Primary | `--color-primary` | #D97898 | CTAs, links, active states, accents |
| Primary Light | `--color-primary-light` | #EFB4C5 | Hover states, soft backgrounds |
| Primary Dark | `--color-primary-dark` | #AD4B64 | Pressed states, text on light pink |
| Secondary | `--color-secondary` | #B88967 | Gold accent, stars, secondary highlights |
| Neutral 50 | `--color-neutral-50` | #FAFAF9 | Page background |
| Neutral 100 | `--color-neutral-100` | #F5F3F0 | Skeletons, section bg |
| Neutral 200 | `--color-neutral-200` | #E8E4DF | Borders, dividers |
| Neutral 400 | `--color-neutral-400` | #A8A09A | Muted text |
| Neutral 700 | `--color-neutral-700` | #3D3530 | Strong text on light |
| Neutral 900 | `--color-neutral-900` | #1A1512 | Primary text |
| Neutral 950 | `—` | #0F0C0A | Darkest elements |
| Surface | `--color-surface` | #FFFFFF | Cards, overlays |
| Error | `--color-error` | #C0392B | Error states |
| Success | `--color-success` | #27AE60 | Success states |

### Forbidden Colors

- Never use `#000` or `#fff` directly. Use `neutral-950` and `surface` instead.
- Never use generic `text-gray-*` or `bg-gray-*`. All neutrals are warm-tinted.

## Typography

### Font Families

- **Display**: Playfair Display (var `--font-display`) — headings, prices, editorial moments. Note: Playfair Display is on impeccable's reflex-reject list. A future font migration should replace it with something more distinctive.
- **Body**: Outfit (var `--font-body`) — all UI text, labels, navigation, descriptions.

### Type Scale

| Token | Size | Line Height | Tracking | Usage |
|-------|------|-------------|----------|-------|
| `type-display-xl` | 5rem → 3rem mobile | 1.1 | -0.02em | Hero headlines only |
| `type-display-lg` | 3.5rem → 2.25rem mobile | 1.1 | -0.01em | Section heroes |
| `type-display-md` | 2.75rem → 1.75rem mobile | 1.15 | 0 | Large section headings |
| `type-heading-sm` | 1.375rem → 1.375rem mobile | 1.3 | 0 | Card titles, subsections |
| `type-body-lg` | 1.125rem → 1rem mobile | 1.7 | 0 | Long-form body text |
| `type-body-md` | 1rem → 0.875rem mobile | 1.6 | 0 | Default body text |
| `type-body-sm` | 0.875rem → 0.75rem mobile | 1.5 | 0 | Secondary text, captions |
| `type-label` | 0.8125rem → 0.6875rem mobile | 1.4 | 0.12em | Labels (use sparingly!) |
| `type-price` | 1.75rem → 1.25rem mobile | 1.2 | 0 | Product prices |
| `type-nav` | 0.75rem → 0.75rem mobile | 1.4 | 0.14em | Navigation links |

### Typography Rules

- **No labels above headings.** The repeated tiny uppercase tracked label above every section heading is banned. It's the #1 AI slop tell. Headings stand alone or with a subtitle below.
- **No em dashes.** Use commas, colons, semicolons, periods, or parentheses.
- **Scale contrast ≥ 1.25×** between adjacent type levels. Flat scales read as uncommitted.
- **Body line length capped at 65-75ch.**

## Layout

### Spacing

- Section padding: `py-8 md:py-12 lg:py-16` (via `section-padding`)
- Page padding: `px-4 md:px-6 lg:px-8` (via `page-padding`)
- Max content width: `max-w-7xl` (1280px) for sections, `max-w-[1480px]` for full-bleed hero/navbar

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 0.75rem | Small elements, shade swatches |
| `rounded-md` | 1rem | Inputs, small cards |
| `rounded-lg` | 1.5rem | Medium cards, sections |
| `rounded-[1.75rem]` | 1.75rem | Product cards, category cards |
| `rounded-[2rem]` | 2rem | Large cards, info panels |
| `rounded-full` | 50% | Buttons, avatars, badges |

### Shadows

| Token | Usage |
|-------|-------|
| `shadow-card` | Default card elevation |
| `shadow-card-hover` | Card hover state |
| `shadow-editorial` | Hero images, editorial sections |
| `shadow-soft` | Subtle pink-tinted shadows |

## Elevation

Cards use `border border-neutral-200/80 bg-white` by default with `shadow-card`. On hover: `-translate-y-0.5 shadow-card-hover border-primary/25`. No nested cards. No card-inside-card patterns.

## Motion

- Page-load animations: `animate-fade-in-up` with staggered delays (60ms per item). Only on initial mount, not tab switches.
- Hover transitions: `duration-300` for color/opacity, `duration-700` for image scale.
- No bounce, no elastic, no layout-property animations.
- `ease-out-quart` for entrance animations (via `transition-out` in Tailwind config).

## Component Patterns

### Product Cards

- `rounded-[2rem]` border, `shadow-card-default`, hover: `-translate-y-0.5 shadow-card-hover border-primary/25`
- Image aspect: `4/5` with hover scale `scale-[1.045]`
- Quick-add button appears on hover (desktop only), mobile has persistent button
- Shade swatches: small `h-3 w-3 rounded-full` circles with `+N` overflow
- Price: `font-display text-2xl font-semibold`, strikethrough for original

### Buttons

- Primary: `rounded-full bg-neutral-950 text-white hover:bg-primary`
- Secondary: `rounded-full border border-neutral-200 bg-white text-neutral-900 hover:border-primary hover:text-primary`
- All buttons: `min-h-12` (48px touch target), `text-[11px] font-semibold uppercase tracking-[0.18em]`

### Section Headings

- Heading only, no label above. Use `font-display text-4xl font-semibold tracking-[-0.035em] text-neutral-950 md:text-5xl` from Section component.
- Optional subtitle below in `text-[0.9375rem] leading-[1.7] text-neutral-500`.

## Absolute Bans

1. **No labels above headings.** No `type-label` or tiny uppercase tracked text above section titles.
2. **No numbered benefit lists.** No 01/02/03 patterns.
3. **No gradient text.** No `background-clip: text`.
4. **No glassmorphism as default.** No decorative blur cards.
5. **No hero-metric template.** No big number + small label + supporting stats.
6. **No identical card grids.** Vary size, treatment, or emphasis across card groups.
7. **No modal as first thought.** Exhaust inline alternatives first.
8. **No em dashes.** Use commas, colons, or periods instead.
9. **No `#000` or `#fff`.** Use `neutral-950` and `surface` instead.