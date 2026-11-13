# PHASE 17 — Production QA, Windows EXE and manual Cloudflare release

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Do not call the project complete unless the phase matrix has verified PASS for every capability in Windows, web, and relevant DB/printing tests; show exact failures and unresolved blockers.
2. Verify secure owner-only Supabase Auth/RLS against a backed-up staging copy. Authorize production migration only after backup restoration test and user approval. No public anon read/write policies. No fake "just synced" statuses.
3. Run `npm ci`, `npm run lint`, `npm run build`, `npm test`, `npx playwright test`. Cover 1366 desktop, 1024 tablet, 375 and 320 mobile, keyboard, dark/light, PDF 1/20/100+ rows, print logo/text, return/payroll accounting.
4. On Windows x64 build with `npm run desktop:build`, output both portable and installer EXE to `D:\vinay-traders\vinay-traders\re fin`; verify signatures/checksums and startup. The standard Windows EXE is LOCAL-ONLY; do not claim sync with web. A cloud-desktop build requires separate authorized RLS and cross-device tests.
5. Produce `docs/RELEASE_ACCEPTANCE.md`: exact main commit, tests, screenshots, PDFs, Windows artifact paths, SHA256SUMS and backup/rollback plan. NEVER say production deployed unless the deployment actually succeeded.
6. Prepare final manual web deployment commands `npm run build` then `npx wrangler deploy`, verify installed login and correct Cloudflare address. If user requests only instructions rather than deployment, DO NOT deploy.
7. Production security review and user approval are hard release gates; flag missing printer and catalog verification rather than inventing PASS.

## Definition of done (mandatory)

Release gate signed off by evidence; EXE starts on Windows; no unauthorized live deployment; fully documented manual handoff.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_17.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/a_large_clean_modern_ui_design_system_dashboard.png; see the two consolidated PDF manuals.
