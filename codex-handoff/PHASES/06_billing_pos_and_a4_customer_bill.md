# PHASE 06 — Billing / POS and A4 customer bill

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Implement exact supplied Billing/POS look: large search, product grid/list, editable cart, customer lookup, quantity/discount/price controls, balance summary, payment method and controlled save/print workflow.
2. No GST/tax output, no tax invoice terminology. User-facing document is a BILL. Preserve existing bill IDs/numbers in storage. Correct line and cart calculations, partial payments, outstanding balances, stock decrements and concurrency.
3. Redesign customer Bill A4 portrait with actual logo, shop address/mobile/email, customer details, bill no/date, product/variant/qty/unit/rate/discount/amount, subtotal, discount, grand total, paid, due, payment method, signature and remarks. Colors from approved navy/cobalt/gold/green palette; crisp thin borders and 9pt+ legible table text.
4. In long bills, paginate and repeat headers without clipping names. Test print preview, download/share and receipt reopening, payment history and reconciling balance.
5. Use keyboard access, touch-friendly layout, maintain item source pricing on historical bills, prevent scroll-induced numeric changes.

## Definition of done (mandatory)

Invoice creation and printing match reference without GST; sale stock changes once; amounts and outstanding balances reconcile.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_06.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/vinay_traders_bill_pos_redesign_board.png, codex-handoff/VISUALS/vinay_traders_pos_redesign_showcase.png; see the two consolidated PDF manuals.
