# PHASE 00 — Audit, backup, and baseline

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Read the existing `docs/IMPLEMENTATION_STATUS.md`, `docs/RELEASE_HANDOFF_AND_REMAINING_WORK.md`, `docs/security/README.md`, package scripts and ALL business modules. Inventory every route, UI state, PDF output and data relationship.
2. Inspect Git status and the current main commit; never discard user changes. Preserve historical purchases/bills, client and supplier IDs, payments and stock ledger.
3. Establish safe mock fixtures, a test workspace and a migration/rollback plan. Back up the production database with owner approval; do not assume it is safe or accessible. Document baseline screenshots at 1366x768, 1024x768, 375x812 and 320x700.
4. Create `docs/CODEX_IMPLEMENTATION_MATRIX.md` with each phase, observed code, gaps, acceptance checks, screenshot reference, exact commit, and status. Never mark a phase complete from code presence alone.
5. Read the two reference PDFs in this handoff and identify every `VISUALS/` and `PRINT_SAMPLES/` file. Identify missing catalogs and explicitly ask for the authoritative source files; never invent product data.

## Definition of done (mandatory)

CI baseline passes; inventory and risk matrix documented; safe rollback strategy exists; no production records changed.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_00.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/a_large_clean_modern_ui_design_system_dashboard.png, codex-handoff/VISUALS/vinay_traders_ui_glitch_fix_reference.png; see the two consolidated PDF manuals.
