# Pottery Atlas visual direction

## Design brief

An **iPhone-first ceramic studio inventory**, not a generic SaaS dashboard or ecommerce checkout. The main action is adding a piece; secondary actions are finding it and checking its glazes, clay weight and price. Use an unhurried, tactile editorial language associated with ceramic materials.

## Selected aesthetic

**Studio ledger / ceramic editorial**

- Warm paper (`#f7f4ed`), clay brown (`#91573c`), forest ink (`#344b3d`).
- A humanist display serif (Fraunces) combined with plain readable DM Sans; system fallbacks.
- An original inline SVG pottery still life rather than stock photos, false reviews, busy gradients, abstract orb decoration, or canned marketing numbers.
- Simple dividers, actual item photography, open white space and a clear hierarchy.
- Real records instead of fake demo product cards. An empty catalogue invites the first piece.

## iPhone priorities

- Target the real widths of smaller iPhones (320/375 px), current 390/393 px screens and larger 430 px displays.
- The catalogue becomes one column at 510 px and below so pieces are not squeezed into tiny cards.
- Header offers an immediate **Add a piece** action without a hamburger menu.
- Forms use 16 px input text, which prevents Safari from automatically zooming the viewport when the keyboard opens.
- Native HTML `<dialog>` for editing and piece details, with touch targets at least ~44 px for primary controls.
- Viewport-fit cover and `env(safe-area-inset-*)` protect controls from the Dynamic Island/notch and home indicator.
- The editor scrolls vertically within `100dvh`, with a sticky save area above the lower safe area.
- Prefer SVG and static layout rather than an animation-heavy hero.
- Support reduced motion, keyboard navigation, semantics, visible focus rings and useful input labels.
- Image uploads use the native iPhone photo picker where supported, then resize client-side.

## Design-system reference GitHub repositories

These are **references and review heuristics only**, not imported packages, copied code or vendor artwork:

1. [Studio Groei / anti-slop](https://github.com/Studio-Groei/anti-slop) — reject predictable AI-generated templates and generic copy.
2. [Anthropic / frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) — derive visual decisions from the craft rather than default SaaS patterns.
3. [Paul Bakaus / impeccable](https://github.com/pbakaus/impeccable) — shape, critique, polish, harden and check responsive behavior.
4. [nextlevelbuilder / ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) — consistent interaction patterns, accessibility and type/spacing systems.
5. [Addy Osmani / web-quality-skills](https://github.com/addyosmani/web-quality-skills) — measurable accessibility, web performance and Core Web Vitals checks.

## Quality checks to run in a real browser

Check Safari at 320/375/390/393/430 CSS px, mobile Chrome, and desktop widths. Test the form with the keyboard open, photo uploads, glaze rows with long names, zoom/large text, dark-mode default, save state, search with no matches, and orientation changes.

Static source review is not a substitute for a live Lighthouse/Safari audit. This release does not claim a measured performance or accessibility score.
