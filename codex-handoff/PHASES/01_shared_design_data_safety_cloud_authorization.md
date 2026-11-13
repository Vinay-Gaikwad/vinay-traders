# PHASE 01 — Shared design, data safety, cloud authorization

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Create one professional UI system following the supplied references: deep navy sidebar, cobalt primary, teal success, gold/orange accents, light neutral surfaces, crisp typographic hierarchy, 8px spacing grid, consistent focus rings and error states, light/dark modes.
2. Fix nav rail clipping, nested scrollbars, sidebar active state, table sort indicators, modals, global search, menu bar spacing, sticky navigation, mobile tabs, keyboard and screen-reader interaction. Preserve the user-provided logo and branding.
3. Prevent mouse wheel and arrow keys from accidentally incrementing numeric quantity/rate/discount fields throughout the entire app, without interfering with normal scrolling, keyboard editing, accessibility or explicitly intended controls.
4. Audit Supabase access. The initial `anon` policies are potentially permissive: create safe, reviewed staging-only migration plan with member-only RLS and Auth; verify backup/restore, role membership and access denial for unauthorized users before production rollout. Never execute a destructive policy migration without verified owner access and an explicit release gate.
5. Verify client-local Windows build versus cloud-connected web behavior; no misleading 'synced' status. Test conflict prevention, reload persistence, offline and reconnect scenarios. Separate UI redesign from business logic.

## Definition of done (mandatory)

All navigation responsive, no clipped/overlapping controls, UI comparisons captured, security cutover not marked finished unless staging test + owner verification prove it.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_01.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/a_large_clean_modern_ui_design_system_dashboard.png, codex-handoff/VISUALS/vinay_traders_ui_glitch_fix_reference.png, codex-handoff/VISUALS/a_detailed_comprehensive_ui_ux_redesign_specifica.png; see the two consolidated PDF manuals.
