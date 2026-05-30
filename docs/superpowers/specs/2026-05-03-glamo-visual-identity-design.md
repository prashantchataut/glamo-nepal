# GLAMO NEPAL Visual Identity Design Spec

## Design Philosophy: "Luminous Heritage"

### The Movement

Luminous Heritage is the visual philosophy where Kathmandu's ancient artistry meets the precision of modern editorial beauty. It draws from the way morning light hits a temple spire — soft, golden, layered with centuries of meaning — and translates that into digital surfaces that feel both timeless and immediate. Every composition is meticulously crafted, the product of deep expertise and painstaking attention to the interplay between warmth and structure, between the organic imperfections of handmade things and the clean authority of high fashion typography.

The philosophy manifests through space that breathes — generous negative areas that let key elements float with intention rather than crowd for attention. Color exists as atmosphere, not decoration: deep mauve-purple grounds like twilight over the valley, soft lavender-pink drifts like the haze of incense, warm gold accents land with the precision of a gilded mandala line. These are never applied as fills but as radial breaths, soft gradients that suggest a light source just beyond the frame, the work of countless refinements to achieve effortless-looking depth.

Form follows the logic of natural beauty — petals that open asymmetrically, spheres that catch light like pearls, arcs that echo the curve of a brow. Geometric elements appear only as deliberate punctuation: fine gold circles that suggest completeness without completing, thin lines that anchor rather than divide. The result should look like it was labored over by someone at the absolute top of their field — every radius, every opacity value, every bezier curve tuned until the whole composition sings with quiet confidence. Texture is the invisible hand: subtle grain that prevents digital flatness, soft blurs that create aerial perspective, overlapping transparencies that produce unexpected tertiary warmth where colors meet.

Typography exists in two registers: editorial authority through Cormorant Garamond — where italic forms carry the sensuality of a whispered confidence — and modern clarity through DM Sans — where information is delivered with clean efficiency. Headlines command through scale and weight, never through decoration. Body text recedes to serve. The interplay between serif and sans creates a rhythm that echoes the contrast between heritage and modernity that defines the brand. Every typographic decision should appear as though it took countless hours to calibrate — because the difference between almost-right and perfect is the difference between a template and an identity.

### Quality Standards

- Does this look like Charlotte Tilbury? **Yes** — editorial confidence, warm luxury, considered restraint
- Does this look like a developer made it? **No** — every element shows master-level execution and painstaking craft
- Would a Nepali woman aged 18-35 find this beautiful? **Yes** — it honors her aesthetic heritage while speaking her modern language
- Does it feel unique to GLAMO NEPAL? **Yes** — the palette, the botanical references, the editorial warmth are unmistakably this brand

---

## Asset Specifications

### Asset 1: Hero Background Composition
- Desktop: 1440×760px, Mobile: 390×750px
- Base gradient 135deg: #FDF6F9 → #F0E5F5 → #FDF6F9
- Soft blobs: right (#D4A0D7, 0.35 opacity, 600×600 blur 120px), bottom-left (#8B3A8F, 0.12, 400×400 blur 80px)
- Gold geometric arcs: #C9A84C, 0.2 opacity, 0.75px stroke, 80/140/200px radius, 3/4 circles
- Scattered petals: #8B3A8F, 0.08-0.12 opacity, organic placement
- Grain texture: 0.03 opacity
- Gold line accent: 60px, 1px, left side with diamond
- Pearl dots: 5-7 spheres, white→#D4A0D7→transparent gradient

### Asset 2: Hero Floating Annotation Cards
- Card A: "Natural Ingredients" — white bg, purple accent bar, leaf icon
- Card B: "4.9 Rating" — purple gradient bg, gold star
- Card C: Price pill — white bg, gold border

### Asset 3: Trust Badge Icons (6 icons + sprite)
- Cruelty Free, Dermatologist Tested, Vegan Formula, 100% Authentic, Safe for All Skin, Free Delivery
- 32×32px, line style, white stroke, 1.5px

### Asset 4: Promotional Banners (2)
- Banner A: "Summer Glow Sale" — dark luxury, 680×420px
- Banner B: "New Arrivals" — light editorial, 680×420px

### Asset 5: Section Dividers (3)
- Soft Wave, Blush Curve, Gold Sparkle Line

### Asset 6: Philosophy Banner Background
- Full-width, 400px height, botanical outlines, soft gradient

### Asset 7: Product Card Background Tile
- 400×400px, #FDF6F9 base, subtle pattern at 0.03 opacity

### Asset 8: Newsletter Section (2 options)
- Dark luxury version
- Light editorial version

### Asset 9: 404 Page Illustration
- Cosmetic pouch with products, mirror reflecting "404"
- 480×360px viewBox

### Asset 10: Loading Skeletons
- Product card skeleton: brand-colored shimmer
- Hero skeleton: full-width shimmer

---

## Integration Plan

### File Structure
```
public/images/
  editorial/
    hero-bg-desktop.svg          # Asset 1
    hero-bg-mobile.svg           # Asset 1
    philosophy-bg.svg            # Asset 6
    newsletter-dark.svg          # Asset 8
    newsletter-light.svg         # Asset 8
    promo-summer-glow.svg        # Asset 4A
    promo-new-arrivals.svg       # Asset 4B
  dividers/
    wave-dark.svg                # Asset 5A
    blush-curve.svg              # Asset 5B
    gold-sparkle-line.svg        # Asset 5C
  product-card-bg.svg            # Asset 7
  404-illustration.svg          # Asset 9

src/components/ui/
  illustrations/
    HeroBackground.tsx           # Asset 1 React component
    HeroCalloutCards.tsx          # Asset 2 React component
    TrustIcons.tsx               # Asset 3 React components + sprite
    PromoBanners.tsx             # Asset 4 React components
    SectionDividers.tsx          # Asset 5 React components
    PhilosophyBackground.tsx     # Asset 6 React component
    ProductCardBg.tsx             # Asset 7 React component
    NewsletterBackground.tsx      # Asset 8 React component
    NotFoundIllustration.tsx      # Asset 9 React component
    LoadingSkeletons.tsx          # Asset 10 React components
```

### Pages to Modify
1. `HeroBanner.tsx` — Add background composition + floating cards
2. `TrustBadgeAuto-rotation.tsx` — Replace lucide icons with custom SVGs
3. `PromoBannerGrid.tsx` — Replace with editorial banners
4. `BrandPhilosophyBanner.tsx` — Add background + botanical SVGs
5. `ProductCard.tsx` — Apply background tile
6. `NewsletterSignup.tsx` — Add background treatment
7. `not-found.tsx` — Replace with custom illustration
8. `Skeleton.tsx` + `loading.tsx` — Replace with branded skeletons
9. Homepage `page.tsx` — Add section dividers between sections

### Accessibility Requirements
- All decorative SVGs: `aria-hidden="true"`
- All SVGs: responsive via `viewBox` with `width="100%"`
- Animations: respect `prefers-reduced-motion: reduce`
- Performance: convert background SVGs to CSS `background-image` where possible