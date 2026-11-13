# PHASE 03 — Inventory, catalogs, supplier links and pricing

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Rebuild inventory dashboard and product list with clear KPI cards, category tabs, status/low-stock filters, supplier dropdown, supplier/phone display, variant and sales unit, reorder threshold, ledger and reliable search.
2. Add/Edit Product fields: product name, brand, category dropdown with actual categories, size/variant, unit, barcode, HSN only if legacy/imported (never use it to impose GST), selected supplier ID and visible supplier name/mobile, purchase rate, selling rate, default discount, stock and reorder level.
3. Compute effective selling rate = sellingRate * (1 - discount/100); margin amount = effective selling rate - purchase rate; margin percentage = margin / purchase rate * 100 when purchase rate > 0. Handle zero cost, loss, multi-unit conversion and rounding. Never display an incorrect positive margin.
4. Preserve stock ledger integrity: product stock edit creates a stock-adjustment record; completed purchase adds stock; completed sale subtracts; return adds original quantity exactly once. No duplicate adjustments on editing/canceling.
5. Import 100% of each supplied authentic supplier catalog: preserve product names, variants, units, SKUs and zero/leading digits. Keep file/page provenance, produce unresolved-values report, validate duplicates and rates before committing. Do NOT import demo design images as real product catalogs; the authoritative catalogs have not yet been supplied in this handoff.
6. Test every product filter, saved edit, purchase link, stock ledger, export, print, and category/supplier persistence.

## Definition of done (mandatory)

Supplier-linked inventory works; discounts alter margins; stock ledger reconciles; catalog import marked BLOCKED until real source PDFs are provided.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_03.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/a_detailed_comprehensive_ui_ux_redesign_specifica.png, codex-handoff/VISUALS/a_large_detailed_infographic_ux_redesign_specific.png; see the two consolidated PDF manuals.
