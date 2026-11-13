# PHASE 14 — Returns and revised bills with commission settlement

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Implement a dedicated Returns module. Browse historical bills, open original, choose one or more returned line quantities, validate returnable units against already returned amounts, and confirm exactly once.
2. Persist immutable original bill AND a revised bill/return-credit record with a linked revision chain, not destructive overwrites. A4 print view must show original bill and updated bill/return adjustments below or on following A4 page, readable and labeled.
3. Returned stock increases inventory exactly once with ledger reference. Correct customer paid/due/refund, refund methods and partial refund history. If restocking condition unsuitable, track separately instead of silently adding sellable stock.
4. Recalculate plumber referral earnings and reward jar on adjusted eligible value, preserve paid payouts and show explicit overpayment carried forward. Prevent negative balances hidden as zero and duplicate refunds or returns.
5. Transactional integrity/idempotency, concurrency tests: half of item returned, entire item returned, repeated click/retry, already returned quantities, prepaid and part-paid bills, refunded and non-refunded states.
6. A4 return PDF must preserve original and adjusted bill, clear difference row/column, net amounts, refund status, signatures and actual logo.

## Definition of done (mandatory)

Stock, customer account, original/revised bill and plumber commission reconcile to ledger; duplicate return rejected.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_14.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/vinay_traders_bills_history_redesign.png; see the two consolidated PDF manuals.
