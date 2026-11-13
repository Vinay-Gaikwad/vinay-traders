# PHASE 04 — Quotations

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Redesign quotation list, create/edit/preview modal and detail screen to match reference UI; large readable type, branded colors, desktop/mobile layouts.
2. Add working From/To date pickers, customer name and quotation number search; sort newest/oldest and preserve draft/sent/accepted/expired states and original dates.
3. Calculate line totals, discounts, grand total, validity date and remarks without GST; prevent price field scroll-wheel changes and preserve historical quote prices after inventory price updates.
4. Generate full A4 portrait quotation PDF using the actual logo, header, customer and validity details, item table, subtotal/discount/grand total, remarks and signature; page-break logically with repeated headers. Never screenshot-slice a long DOM to create unreadable PDFs.
5. Compare captured screenshots against `VISUALS/` and test 1/20/100+ item rows, Marathi names and Windows printing.

## Definition of done (mandatory)

Date/name searches return correct history; edited quotation persists; A4 export readable, no cut-off totals or duplicated pages.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_04.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/vinay_traders_quotation_ui_board.png; see the two consolidated PDF manuals.
