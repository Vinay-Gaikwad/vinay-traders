# PHASE 10 — Plumbers / referral partners

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Redesign plumber dashboard, directory, add/edit, profile, referred customers, referred bills, commission ledger, payments, reward jar and payout modal according to board.
2. Separate name and mobile searches; retain region, commission percent, joining date, bank/UPI fields, notes and status.
3. Compute commission from eligible saved bill amount once; apply agreed exclusions, returns and partial return recalculation. If already paid commission exceeds revised earned, show explicit carry-forward/advance rather than deleting historic payments.
4. Pay/record commission and reward jar with amount, method, date, reference and audit history. Validate available balances and prevent duplicate commission entries.
5. Provide A4 directory, referral customer/bill history, commission ledger, payouts and profile reports using supplied six PDF references.

## Definition of done (mandatory)

Referral totals, payment histories, rewards, return reversals and all A4 exports reconcile.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_10.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/Plumber_Module_Main_Design_Board.png, codex-handoff/VISUALS/Plumber_Module_Forms_Design_Board.png; see the two consolidated PDF manuals.
