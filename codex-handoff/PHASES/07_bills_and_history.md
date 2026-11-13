# PHASE 07 — Bills and History

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Redesign bills history list, summary metrics, detail, filters and actions from reference board. Two independent searchable filters: From/To date picker and customer name; also bill number search.
2. Show paid/part-paid/due/draft/returned/revised status accurately. Provide open original, print, download A4, payment history and link to return/revision without destroying the original record.
3. Render columns consistently and remove native gray boxed sorting widgets and unwanted horizontal overflow on desktop; horizontal scroll only when unavoidable.
4. Test old customer bills, walk-in bills, filters across boundaries and pagination; ensure no raw JSON in exported history.

## Definition of done (mandatory)

Saved bills can be found by date/customer, reopened and exported exactly; old bill data immutable.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_07.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/vinay_traders_bills_history_redesign.png; see the two consolidated PDF manuals.
