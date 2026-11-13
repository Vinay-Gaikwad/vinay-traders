# PHASE 13 — Pat Sanstha / multiple daily deposits

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Redesign Pat Sanstha dashboard and add-deposit modal based on attached boards. Allow unlimited named organizations, each with its own default expected daily amount, active status, optional notes and independent records.
2. Store multiple plan deposits on same date with composite uniqueness by organization and date; allow edit, skipped/holiday, partial and paid state, receipt/payment method, notes. Changing a future daily amount must not rewrite old expected amounts.
3. Dashboard daily/weekly/monthly summaries filter correctly; distinguish total expected, actual paid, outstanding and missed days. Add per-organization filter, records, date picker, report periods and export.
4. PDF A4 ledger includes plan name, date, expected, paid, due, status and method. Long reports repeat header, total by organization and overall and preserve numeric formatting. Do not compute monetary summaries by parsing formatted display strings.
5. Test two organizations with ₹500 and ₹350 daily, same-day entries, partial deposits, plan amount edits and zero periods.

## Definition of done (mandatory)

Multi-plan deposits and historical amounts consistent; each plan independently configurable; PDF totals reconcile.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_13.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/a_polished_modern_saas_dashboard_redesign_and_ui.png, codex-handoff/VISUALS/a_polished_detailed_dashboard_ui_mockup_for.png; see the two consolidated PDF manuals.
