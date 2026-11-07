# Later Cloudflare D1 + R2 connection

This release has **no D1 database or R2 object-store bindings** and no hard-coded bucket names, IDs or secrets.

When ready:

1. Create a Cloudflare D1 database and run [schema.sql](schema.sql).
2. Create an R2 bucket for photographs (Cloudflare's product is **R2**, not D2).
3. Add D1 and R2 bindings to the Worker environment after the resources exist; do not commit secret keys.
4. Implement authenticated write endpoints for adding, editing and deleting pieces. Never publish a write API without identity and authorization.
5. Process images and restrict upload size and content type; store only opaque object keys in D1.
6. Implement a public read-only gallery **if desired**, separating public display from private studio data.
7. Add a user-triggered import of the existing version-1 JSON backups, preserving photographs, glaze layering order and any legacy clay composition data.

Adding bindings alone will **not** sync or publish browser IndexedDB records. Until a backend and migration exist, the site continues to use a distinct local collection for each browser.
