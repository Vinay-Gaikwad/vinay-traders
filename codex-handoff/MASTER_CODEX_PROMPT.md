# Vinay Traders — Codex Project Handoff

**Project:** Vinay Traders · Hardware & Plumbing Supplies · Windows Electron + React/TypeScript + Cloudflare Workers + Supabase + GitHub.  
**Repository:** `https://github.com/Vinay-Gaikwad/vinay-traders`  
**Working branch:** `main` (only branch).  
**Shop:** Shirala, Sangli, Maharashtra.  
**Production URL:** `https://vinay-traders.vinayvikasgaikwad.workers.dev/` (read-only context; not verified live in this handoff).  
**Absolute user requirement:** do not add GST/taxes. All customer documents are **Bills**, not GST invoices.  
**Asset source:** user-supplied design references and prior generated design samples, not real product catalog evidence.  

**Do not treat earlier passing builds as phase sign-off.** The repository has partially implemented modules; inspect and repair the real code instead of copying descriptions or hardcoding demo data.

## YOUR ROLE — LEAD ENGINEER, UI ARCHITECT, ACCOUNTING QA AND RELEASE REVIEWER

You are working INSIDE the already-open `D:\vinay-traders\vinay-traders` checkout on branch `main`. Implement all the requirements of the Vinay Traders project one section at a time, with production-grade quality and demonstrated verification. **Do not stop after only drafting a plan; write real code, run tests, open the working app, create screenshot and PDF evidence, and commit each verified module.** If a task is blocked by an absent product catalog, production credentials, physical printer or owner authorization, mark it `BLOCKED` with exact evidence and continue independent safe tasks without making up data or claiming success.

### Read these FIRST (strict order)

1. `codex-handoff/README_FIRST.md` and `codex-handoff/SECTION_BY_SECTION_CODEX_PROMPTS.md`.
2. `codex-handoff/01_UI_DESIGN_REFERENCE_MANUAL.pdf` and `codex-handoff/02_A4_PDF_FORMAT_REFERENCE_MANUAL.pdf`.
3. `codex-handoff/VISUALS/` images at full resolution; `codex-handoff/PRINT_SAMPLES/` sample PDFs.
4. `docs/IMPLEMENTATION_STATUS.md`, `docs/RELEASE_HANDOFF_AND_REMAINING_WORK.md`, `docs/security/README.md`, the existing `src` / `electron` / `supabase` / tests / CI scripts.
5. The user requirements in the phase prompts, especially tax-free billing, returns, payroll and supplier attachments.

### Priority / conflict policy

- **Highest priority:** existing business records, authorization, privacy, financial/stock correctness and working desktop/web application.
- **Then:** exact visual design structure from included reference images, consistent brand, readability and print rules.
- Preserve architecture, routes and IDs unless a safe migration is required. Screenshots are visual references, not source data and not evidence that a feature works.
- No GST/CGST/SGST/tax entries or tax invoice UI. Use `Bill`; a supplier's externally received invoice can still be labeled `Supplier invoice`.
- Never replace repo with a fresh starter. Never mass-delete code or data. No unverified business assumptions. No fabricated supplier products, rates or historical accounting.
- Do not upload production data, credentials or customers' phone numbers to public GitHub. No automated public Cloudflare deployment until owner approves security cutover.

### Implementation contract (mandatory for EVERY phase)

1. Locate all related components, hooks, types, DB/migrations, exports and tests. Document preexisting behavior and precise gaps.
2. Compare current UI to the exact included image pages and translate layout, spacing, hierarchy, color and behavior to actual responsive code; no dead demo buttons.
3. Implement with real existing application state. Handle empty, loading, error, no permission, invalid input, long text, big tables and mobile.
4. Add tests for critical formulas and side effects, especially no duplicate stock changes/payments/returns and no change of historic rate or payslip.
5. Verify `npm run lint`, `npm run build`, `npm test` and appropriate browser/Electron tests. Fix every introduced failure; no `@ts-ignore` and no skipping tests to fake a pass.
6. Export the module's REAL A4 PDFs and inspect pages with images/screenshot evidence; test multi-page with 1, 20 and 100+ rows. Document any blocked device checks.
7. Save `docs/codex-qa/PHASE_XX.md` with: modified files, schema changes, before/after screenshots, PDF previews, exact calculation examples, all commands/results, unresolved issues, and `PASS / PARTIAL / BLOCKED`.
8. Commit after a validated phase with `Phase XX: <specific fix>`. Update `docs/CODEX_IMPLEMENTATION_MATRIX.md` truthfully. Continue to next phase without resetting earlier work.

### Design standards

- Follow the **actual image boards**: nav #102747/deep navy, action cobalt #2563EB, orange/gold accent, teal success, white/light-gray surfaces. Use existing brand logo asset `public/vinay-traders-logo.*` instead of recreating it.
- Sidebar and tab styles should be visually consistent across Purchase, Inventory, Quotations, Barcodes, Billing, History, Customers, Suppliers, Plumbers, Workers, Attendance, Pat Sanstha, Returns, Expenses, Dashboard, Settings and Notifications.
- Typography readable at standard Windows zoom; strong 20–28px page headings, 14–16px form text, >=40px control tap target, no tiny sort boxes; 8px spacing rhythm and accessible color contrast.
- Match screenshots at 1366x768 and desktop large; also pass 1024x768, 375x812 and 320x700. No accidental sideways page scroll; horizontal table scroll is allowed only in a bounded table container.
- No wheel or arrow-key change to focused numeric fields; changing values must require intentional typing/input controls.
- Dark/light mode appropriate and print reports always on white A4 with deliberate print colors.

### PDF engine and business calculations

- Use vector text/tables, real logo and correct saved data, not a static screenshot of an arbitrary HTML container. Avoid raw JSON, dashes in available numeric fields, black squares for rupee/Marathi, clipped cells, orphaned totals and footers.
- A4 Portrait (210×297mm) Purchase Invoice, customer Bill, Quotation, worker Payslip, Returns comparison when readable. A4 Landscape (297×210mm) Purchase Register and Product Purchase Report; use logical orientation for other wide ledger reports.
- Repeat tables headers on next A4 page. Page numbering, report period, generation timestamp, logo, footer, readable minimum fonts and print-safe margins. Test 1/20/100+ rows.
- Prevent GST from leaking from legacy saved fields. Rates and discounts exact, business round-off consistent, rupee formatted. Preserve historic transactions and immutable original bills.
- Treat stock, refunds, plumber commissions, worker balances and Pat Sanstha records as auditable changes, not overwritten display figures.

### Required phase sequence

Execute Phase 00 and Phase 01 safety first, then 02 Purchase, 03 Inventory, 04 Quotation, 05 Barcodes, 06 Billing, 07 History, 08 Customers, 09 Suppliers, 10 Plumbers, 11 Workers, 12 Attendance, 13 Pat Sanstha, 14 Returns, 15 Expenses, 16 Dashboard/Notifications/Settings, 17 Release QA. Read `codex-handoff/PHASES/XX_*.md` and meet each acceptance case; do not mark source-present modules as complete without QA.

### Final release deliverables

- Last tested commit SHA and evidence-backed phase matrix (18 rows, PASS/PARTIAL/BLOCKED).
- Working web build and **locally built** `.exe` installer and portable from this exact commit in `D:\vinay-traders\vinay-traders\re fin` (only when running on user's Windows computer).
- A4 PDFs, before/after UI screenshots and tests saved in `docs/codex-qa/`.
- Audit for secure Supabase owner authentication, RLS, backups and cloud/desktop synchronization limitations.
- User can deploy manually only AFTER security gates and final verification. Do not deploy production automatically.

**START NOW:** Read the documents; create a gap/coverage matrix against all 18 phases; implement Phase 00 and 01, verify them, then continue sequentially. Be autonomous about code/tests, but never assert unverified production readiness or bypass approval for security-sensitive actions.
