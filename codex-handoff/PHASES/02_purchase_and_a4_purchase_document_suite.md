# PHASE 02 — Purchase and A4 purchase document suite

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Rebuild New Purchase as a clean desktop/mobile editor: supplier search with validated selection, products, variants, quantity, unit, rate, discount, bill totals, paid/due, due date and purchase status. Preserve all line items and business rules. Show accurate draft/completed payment states.
2. Let users upload supplier's original PDF/JPG/PNG invoice. On save, persist attachment and purchase record transactionally; show purchase in register immediately. In previous purchase detail, show 'View / Download original supplier invoice'. Respect actual Windows/Electron popup restrictions. Do not serialize large base64 data into an unbounded synced JSON state; plan migration to private authenticated object storage and retain compatibility with existing attachments.
3. Purchase register must have separate supplier-name search and purchase-number/date filters, totals, statuses, sort, pagination and clickable historical rows. Ensure currency inputs cannot change via mouse scrolling. Validate non-negative rates, qty > 0, discount 0-100 and totals exactly.
4. Implement 3 distinct A4 PDFs, matching `PRINT_SAMPLES/` layout and the PDF manual. Purchase Invoice: A4 portrait, supplier metadata and full line table, totals and signature. Purchase Register: A4 landscape, 10 explicit columns, counts rather than JSON objects, summary totals. Product/Purchase Report: A4 landscape, per-line product/variant/qty/unit/rate/amount; calculate amounts from persisted line items and show real values instead of dashes.
5. The original supplier invoice uploaded by staff is not the same as the shop-generated Purchase Invoice report. Keep both separately accessible and verifiably identical on reopen.
6. Test 1/20/100+ rows, long supplier names, discounts and partial payments; test PDF page size, repeat headers and logo; run finance regression tests before committing.

## Definition of done (mandatory)

Create -> attach -> save -> reload -> view original -> export all three PDFs passes in Windows and browser; true item values and amounts; no raw JSON or clipping.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_02.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/vinay_traders_purchase_module_redesign_board.png, codex-handoff/VISUALS/vinay_traders_pos_redesign_showcase.png; see the two consolidated PDF manuals.
