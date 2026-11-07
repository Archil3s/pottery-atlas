# Pottery Atlas

A pottery studio catalogue built as an elegant, responsive static website for Cloudflare Workers.

## The catalogue

For each pottery piece you can record:
- The name and **purpose** of the piece
- **Clay weight in grams**
- A **glaze combination** with multiple glaze names, application order and optional layer/placement notes
- **Asking price in NZD**
- An optional photograph and studio notes

Other features: browse cards, search across names/purposes/glazes, sort by newest or price, edit, delete, and see collection totals.

### Important: storage is currently device-local

This release works **without Cloudflare D1 or R2**. It uses the browser's IndexedDB to store records and photos on the device where they are entered. Records are **not available to other visitors or synced across devices**. Clearing browser website data can delete them.

Version 2 backups contain glaze combinations. Version 1 backups can still be imported: old clay compositions are preserved as clearly labelled legacy data, not silently converted to glazes.\n\nUse **Export backup** to download a JSON file containing your records and photographs. Use **Import backup** to restore them, even on another device. The optional Cloudflare D1/R2 upgrade plan is in [storage/README.md](storage/README.md). There is no unprotected public write API.

## Cloudflare Workers Builds

The repository is `Archil3s/pottery-atlas`, default branch `main`. The existing Worker service remains named `clipbridge-windows` to avoid unintentionally creating a different Worker.

In Cloudflare Workers Builds, configure:
- Repository: `Archil3s/pottery-atlas`
- Production branch: `main`
- Root directory: **repository root** (blank or `/`, as Cloudflare's UI requires); **not** an old Clipbridge directory
- Deploy command: `npm run deploy` (or `npx wrangler deploy`)
- Assets directory: `./public` from `wrangler.jsonc`

No API token other than Cloudflare's normal Git deploy authorization and no data-storage bindings are required.

**If a Cloudflare build still says "root directory not found", change the root-directory setting in the Cloudflare dashboard**. A Git commit cannot alter that dashboard setting.

For Cloudflare Pages rather than Workers Builds: no framework, output `public`, and no build command. Do not mix Workers and Pages settings.

## Local development

```sh
npm install
npm run dev
```

Open the Wrangler local development URL. To deploy manually, run `npm run deploy`. The site uses native HTML/CSS/JS with no runtime framework.

## iPhone-first design

Design decisions and phone testing targets are documented in [DESIGN.md](DESIGN.md). Built for Safari on 320, 375, 390, 393 and 430 CSS-pixel viewports as well as desktop.

## Smoke test

1. Add a piece with two glazes (e.g. a base coat and an overglaze), a clay weight, purpose, price, and photo.
2. Add several glaze layers without percentages; the order is kept. An unglazed piece is also allowed.
3. Refresh the page: the piece should persist on that browser only.
4. Search, sort, edit, view details, and delete.
5. Export and import JSON backup, including the photo.
6. Test on an iPhone (Safari) with keyboard open, including safe-area bottom navigation.
7. Confirm Cloudflare deploy root path is valid and Worker serves `/`.
