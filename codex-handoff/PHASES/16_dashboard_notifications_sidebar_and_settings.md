# PHASE 16 — Dashboard, notifications, sidebar and Settings

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Redesign main dashboard, global side navigation, notification center and Settings with screenshot references: compact nav groups; sticky topbar; dark navy; business performance cards; professional chart; recent bills and inventory alerts; meaningful quick actions and warning badges.
2. Add dashboard Export PDF for Daily, Weekly, Monthly, Yearly and optional custom range, date boundaries in Asia/Kolkata shop local time, actual data for stock, purchases, sales, returns/refunds, supplier/customer dues, workers/payroll, attendance, personal/shop expenses and Pat Sanstha deposits.
3. Charts, widgets and alerts must reconcile with underlying ledger; distinguish gross sales, net returns, cash collected, balance, stock value and expenses. No fake growth percentages or placeholder numbers.
4. Notification center needs mark read/unread, category filters and deep links to low stock or outstanding records. Settings include shop name, contact, logo, appearance, safe storage, data backup/restore and permissions.
5. Remove obsolete standalone Reports menu while keeping all report export controls on Dashboard and module pages. Responsive sidebars and dark mode must match reference captures.

## Definition of done (mandatory)

Real dashboard numbers reconcile across periods; functional notifications/settings; no sidebar clipping; A4 whole-shop export readable.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_16.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/a_polished_modern_desktop_web_app_dashboard_ui_for.png, codex-handoff/VISUALS/a_large_clean_modern_ui_design_system_dashboard.png, codex-handoff/VISUALS/vinay_traders_ui_glitch_fix_reference.png; see the two consolidated PDF manuals.
