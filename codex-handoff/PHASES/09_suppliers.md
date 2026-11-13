# PHASE 09 — Suppliers

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Apply supplier directory and account board exactly. Search supplier by separate name and mobile fields (both work together), preserve required name/mobile and optional address/notes, add/edit validation, clickable row actions.
2. Show total purchases, purchase count, outstanding credit, amount paid, last purchase and average purchase with correct labels and source calculations; no duplicate payout entries.
3. Supplier account should link purchase history, original uploaded supplier invoice, payments and credits/returns, preserving data through edits.
4. A4 supplier directory landscape; purchase history and supplier account statement portrait where readable. Follow supplied PDF examples with actual logo, print-safe colors and real saved data. Test 12+ supplier list, long names and more than one A4 page.

## Definition of done (mandatory)

Both searches, save/edit, account totals, attachment access and directory/history PDF pass.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_09.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/a_detailed_polished_ui_ux_redesign_collage_of_the.png, codex-handoff/VISUALS/a_clean_modern_saas_dashboard_ui_for_suppliers_i.png; see the two consolidated PDF manuals.
