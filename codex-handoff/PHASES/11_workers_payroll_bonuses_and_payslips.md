# PHASE 11 — Workers, payroll, bonuses and payslips

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Redesign worker directory, add/edit, detailed worker profile, salary tabs, attendance, payment history and activity according to visual boards. Add necessary contact/bank details, status and working rate fields, validated and preserved.
2. Support per-worker bonus rules: daily bonus rate and start/end date picker, multiple non-overlapping or explicitly resolved periods, eligible present/half-day/paid leave rules, payroll period and working days.
3. Keep two separate concepts: contractual base salary persists for future periods; this month's outstanding/payable balance becomes 0 when fully paid. NEVER permanently set the worker's monthly salary to 0 after payment. Previous payslips and salary payments remain discoverable and immutable.
4. Display gross pay, paid days, attendance deductions, overtime, bonuses, advance/loan deductions, net payable, total paid and remaining balance. Ensure one payment cannot be counted twice.
5. Fix empty payslip: A4 portrait downloadable and printable payslip for any period, real company logo/address, worker, salary basis, present/absent/paid days, earnings/deductions, net, paid and due, payment date/receipt, signature.
6. Test no-payment, partial payment, full payment, later period, return to previous payslip, bonus boundaries, rounding and 0 owed after settlement.

## Definition of done (mandatory)

Worker balance zero after full payment, base rate retained, all historical payslips visible, PDF never blank, bonus date rules work.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_11.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/vinay_traders_worker_profile_redesign.png, codex-handoff/VISUALS/vinay_traders_payroll_redesign_board.png, codex-handoff/VISUALS/vinay_traders_reports_payslip_redesign.png; see the two consolidated PDF manuals.
