# Pottery Atlas: Studio Gallery Design

## Direction

**A quiet, photographic archive for a working potter.** The site should feel like a ceramicist's own portfolio, not a SaaS dashboard, a stock template, or an invented ecommerce shop.

This is an original design informed by visual research into two practicing ceramicists' websites. It must not reproduce their site templates, branding, text, photographs, or product images.

## Source study (8 November 2026)

- [Dan Mack Studio](https://www.danmackstudio.com/) and [Gallery](https://www.danmackstudio.com/lookbook3): warm studio photography, close attention to ceramic surfaces, earthy tones, and an understated presentation where form is the centre of attention.
- [Florian Gadsby](https://www.floriangadsby.com/) and [Gallery](https://www.floriangadsby.com/gallery): light, calm backgrounds; unobtrusive interfaces; large deliberate compositions; consistently labelled pieces and detailed descriptions of glazing and techniques.

The influence is **editorial restraint, photography and pacing**, not literal copying. A previous illustrative hero has been replaced with a quieter studio composition that automatically gives way to the potter's own most recent photograph.

## Visual system

- Background `#f9f8f5` (gallery paper); ink `#222220`; restrained warm-grey and natural clay neutrals.
- Low-contrast divider lines, no rounded dashboard cards, gradients, fake statistics, manufactured social proof, or sample photos that could be confused with a user's work.
- Type is mostly precise sans serif (DM Sans). Newsreader is used sparingly for the empty state and editorial text accents.
- A clean **POTTERY / ATLAS** wordmark, small archive subtitle and straightforward **New piece** action.
- Large photography with consistent crops. On the homepage, the latest photographed piece is featured. Without photos, a restrained original SVG vessel appears instead.
- The collection becomes the visual centre: large piece photos, name, purpose, clay weight, glaze names and asking price, separated by white space instead of boxed cards.
- Practical editor sheet remains explicit and accessible; its style is quieter but its workflow is not hidden by aesthetics.

## iPhone-first behaviour

- At 510 CSS px and below, the catalogue becomes a single-column photo gallery. Images remain large enough to appreciate textures and glazes.
- Test 320, 375, 390, 393, 402 and 430 px widths; ensure 44 px+ minimum key touch targets and no horizontal scrolling.
- The header offers the one important action without a hamburger menu. The hero copy precedes the photograph on mobile.
- Form inputs use 16 px text to avoid iOS Safari focus zoom. A `100dvh` scrolling editor and sticky action bar respect `env(safe-area-inset-bottom)`.
- Each glaze row stacks into two full-width input fields on phones, leaving the glaze name and application order legible with the keyboard open.
- Keyboard focus rings, descriptive labels, `prefers-reduced-motion`, semantic article structure, native photo picking and client-side image resizing remain intact.

## Catalogue behaviour and storage

No schema migration is needed for the design change. The existing IndexedDB name remains `pottery-atlas-local-v1`, preserving records across deployments in the same browser and origin. This is **not cloud synchronisation**.

- Records: name, purpose, starting clay weight, asking price (NZD), glaze names in application order, optional placement notes, optional photo, studio notes.
- Legacy clay combinations are stored separately and never relabelled as glazes.
- Export/import supports version 2 JSON backups and older version 1 backups.
- Cloudflare D1 and R2 are not required for this release. See `storage/README.md`.

## Antislop / engineering reference checklist

- [Studio Groei / anti-slop](https://github.com/Studio-Groei/anti-slop) — use real editorial identity, avoid generic SaaS UI patterns.
- [Anthropic / frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) — derive design from the ceramic medium.
- [Paul Bakaus / Impeccable](https://github.com/pbakaus/impeccable) — audit and refine responsive details and interactions.
- [nextlevelbuilder / ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) — predictable interaction states and touch controls.
- [Addy Osmani / web-quality-skills](https://github.com/addyosmani/web-quality-skills) — browser-based accessibility and performance measurements.

## Final browser verification checklist

1. Add an unglazed item and a multi-glaze item, save and reload.
2. Add a real photograph. The featured home image should switch to that photo while other pieces display their own images.
3. Edit, search, sort, delete and export/import without data loss.
4. Test mobile Safari at 320, 375, 390 and 430 px in portrait and landscape; repeat with the on-screen keyboard visible.
5. Run Lighthouse/axe audits and check with VoiceOver, reduced motion and 200% text zoom.
6. Confirm Cloudflare Worker serves `/` from `./public` and uses the correct repository root.

These are validation targets; no live browser score or iOS Safari test is claimed unless actually run.
