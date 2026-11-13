# PHASE 12 — Attendance

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Redesign daily marking and monthly calendar matrix based on reference images. Preserve Present, Absent, Half Day, Paid Leave and unmarked states; use a legend that is not color-only.
2. Add date picker and month/year picker; mark one or all workers with confirmation; check-in/out, overtime and notes where stored. Update existing day's entry idempotently.
3. Monthly summary presents counts and dates for every status and paid-day payroll equivalence. Navigation works at 320px mobile and full 31-day desktop horizontally; keyboard support for changing matrix cells.
4. Ensure edits update worker payroll without deleting historical records; test no entries, all present, weekend, month boundary and different worker policies. Print A4 monthly report with logo, counts, matrix/summary and clear dates.
5. Remove the old standalone Reports navigation (not dashboard report export) exactly as user requested.

## Definition of done (mandatory)

Daily/monthly totals consistent and payroll recalculates safely; no clipped matrix; old standalone Reports nav removed.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_12.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/a_detailed_high_fidelity_ui_redesign_mockup_for_t.png; see the two consolidated PDF manuals.
