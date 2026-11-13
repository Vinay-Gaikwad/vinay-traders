# PHASE 15 — Personal and shop expenses

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Add/modernize expenses module with two distinct ledgers: Personal and Shop. Filter/search by category, description, date, amount, method and worker/owner where applicable.
2. Support category, date/time, payee, amount, cash/UPI/bank, notes and optional receipt attachment. Use permissions and labels to distinguish owner personal spend from operating expenditure.
3. Generate three professionally branded A4 reports: Personal Expense, Shop Expense, Overall Expense. Overall must include a distinct subtotal for each and combined total; never silently count personal spending as business expense. Period filters: custom, daily/weekly/monthly/yearly.
4. Test negative/invalid amounts, date range, edits, deletes (soft-delete/audit if necessary), duplicate imports and receipts. Check print pagination and footer totals.

## Definition of done (mandatory)

All three expense reports correct; no double counting; expenses persist and filter correctly.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_15.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/a_large_clean_modern_ui_design_system_dashboard.png; see the two consolidated PDF manuals.
