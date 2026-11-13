# PHASE 08 — Customers and customer accounts

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Redesign customer dashboard, directory, add/edit form and customer account tabs. Preserve required mobile/name, address/area, notes and all associated historical bills.
2. Show total purchased, total paid, due, credit/advance, and transaction ledger with mathematically reconciled figures. No misleading labels: number of bills is a count, purchases is an amount.
3. Add separate customer-name/mobile searches where appropriate; sorting, status, record opening, paid/partial payment recording and action logs.
4. Produce A4 customer directory/statement, billing history and account reports using logo and print-safe typography. Empty states and permissions must be real, not placeholders.
5. Test credit notes and returns against customers' balance; never double-count paid amounts.

## Definition of done (mandatory)

Customer account totals match underlying bills/payments/returns and A4 exports pass visual review.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_08.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/vinay_traders_customer_module_redesign.png, codex-handoff/VISUALS/vinay_traders_customer_account_report.png; see the two consolidated PDF manuals.
