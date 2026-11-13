# Vinay Traders — Codex Project Handoff

**Project:** Vinay Traders · Hardware & Plumbing Supplies · Windows Electron + React/TypeScript + Cloudflare Workers + Supabase + GitHub.  
**Repository:** `https://github.com/Vinay-Gaikwad/vinay-traders`  
**Working branch:** `main` (only branch).  
**Shop:** Shirala, Sangli, Maharashtra.  
**Production URL:** `https://vinay-traders.vinayvikasgaikwad.workers.dev/` (read-only context; not verified live in this handoff).  
**Absolute user requirement:** do not add GST/taxes. All customer documents are **Bills**, not GST invoices.  
**Asset source:** user-supplied design references and prior generated design samples, not real product catalog evidence.  

**Do not treat earlier passing builds as phase sign-off.** The repository has partially implemented modules; inspect and repair the real code instead of copying descriptions or hardcoding demo data.


---

# Section-by-section Codex instructions

Read `MASTER_CODEX_PROMPT.md` first. Paste individual phase texts if Codex cannot finish a phase autonomously. Never advance a phase from PARTIAL to PASS without QA evidence.


---

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


---

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


---

# PHASE 02 — Purchase and A4 purchase document suite

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Rebuild New Purchase as a clean desktop/mobile editor: supplier search with validated selection, products, variants, quantity, unit, rate, discount, bill totals, paid/due, due date and purchase status. Preserve all line items and business rules. Show accurate draft/completed payment states.
2. Let users upload supplier's original PDF/JPG/PNG invoice. On save, persist attachment and purchase record transactionally; show purchase in register immediately. In previous purchase detail, show 'View / Download original supplier invoice'. Respect actual Windows/Electron popup restrictions. Do not serialize large base64 data into an unbounded synced JSON state; plan migration to private authenticated object storage and retain compatibility with existing attachments.
3. Purchase register must have separate supplier-name search and purchase-number/date filters, totals, statuses, sort, pagination and clickable historical rows. Ensure currency inputs cannot change via mouse scrolling. Validate non-negative rates, qty > 0, discount 0-100 and totals exactly.
4. Implement 3 distinct A4 PDFs, matching `PRINT_SAMPLES/` layout and the PDF manual. Purchase Invoice: A4 portrait, supplier metadata and full line table, totals and signature. Purchase Register: A4 landscape, 10 explicit columns, counts rather than JSON objects, summary totals. Product/Purchase Report: A4 landscape, per-line product/variant/qty/unit/rate/amount; calculate amounts from persisted line items and show real values instead of dashes.
5. The original supplier invoice uploaded by staff is not the same as the shop-generated Purchase Invoice report. Keep both separately accessible and verifiably identical on reopen.
6. Test 1/20/100+ rows, long supplier names, discounts and partial payments; test PDF page size, repeat headers and logo; run finance regression tests before committing.

## Definition of done (mandatory)

Create -> attach -> save -> reload -> view original -> export all three PDFs passes in Windows and browser; true item values and amounts; no raw JSON or clipping.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_02.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/vinay_traders_purchase_module_redesign_board.png, codex-handoff/VISUALS/vinay_traders_pos_redesign_showcase.png; see the two consolidated PDF manuals.


---

# PHASE 03 — Inventory, catalogs, supplier links and pricing

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Rebuild inventory dashboard and product list with clear KPI cards, category tabs, status/low-stock filters, supplier dropdown, supplier/phone display, variant and sales unit, reorder threshold, ledger and reliable search.
2. Add/Edit Product fields: product name, brand, category dropdown with actual categories, size/variant, unit, barcode, HSN only if legacy/imported (never use it to impose GST), selected supplier ID and visible supplier name/mobile, purchase rate, selling rate, default discount, stock and reorder level.
3. Compute effective selling rate = sellingRate * (1 - discount/100); margin amount = effective selling rate - purchase rate; margin percentage = margin / purchase rate * 100 when purchase rate > 0. Handle zero cost, loss, multi-unit conversion and rounding. Never display an incorrect positive margin.
4. Preserve stock ledger integrity: product stock edit creates a stock-adjustment record; completed purchase adds stock; completed sale subtracts; return adds original quantity exactly once. No duplicate adjustments on editing/canceling.
5. Import 100% of each supplied authentic supplier catalog: preserve product names, variants, units, SKUs and zero/leading digits. Keep file/page provenance, produce unresolved-values report, validate duplicates and rates before committing. Do NOT import demo design images as real product catalogs; the authoritative catalogs have not yet been supplied in this handoff.
6. Test every product filter, saved edit, purchase link, stock ledger, export, print, and category/supplier persistence.

## Definition of done (mandatory)

Supplier-linked inventory works; discounts alter margins; stock ledger reconciles; catalog import marked BLOCKED until real source PDFs are provided.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_03.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/a_detailed_comprehensive_ui_ux_redesign_specifica.png, codex-handoff/VISUALS/a_large_detailed_infographic_ux_redesign_specific.png; see the two consolidated PDF manuals.


---

# PHASE 04 — Quotations

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Redesign quotation list, create/edit/preview modal and detail screen to match reference UI; large readable type, branded colors, desktop/mobile layouts.
2. Add working From/To date pickers, customer name and quotation number search; sort newest/oldest and preserve draft/sent/accepted/expired states and original dates.
3. Calculate line totals, discounts, grand total, validity date and remarks without GST; prevent price field scroll-wheel changes and preserve historical quote prices after inventory price updates.
4. Generate full A4 portrait quotation PDF using the actual logo, header, customer and validity details, item table, subtotal/discount/grand total, remarks and signature; page-break logically with repeated headers. Never screenshot-slice a long DOM to create unreadable PDFs.
5. Compare captured screenshots against `VISUALS/` and test 1/20/100+ item rows, Marathi names and Windows printing.

## Definition of done (mandatory)

Date/name searches return correct history; edited quotation persists; A4 export readable, no cut-off totals or duplicated pages.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_04.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/vinay_traders_quotation_ui_board.png; see the two consolidated PDF manuals.


---

# PHASE 05 — Barcode labels

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Redesign barcode generator/list in visual references. Enable product lookup and unit/variant barcode selection, Code128 value validation, label preview, print layout, batch quantity and reprint history where existing data allows.
2. Offer target printer paper sizes including the 50x30mm label. Preserve the actual barcode and human-readable SKU/price/product data; do not duplicate a barcode across distinct SKUs unintentionally.
3. Fix blank barcode prints in Electron and browsers; use a dedicated print area and CSS, do not break A4 invoices. Ensure thermal printer orientation, margins and scaling correctly documented.
4. Capture preview screenshot and generated PDF/image. Validate scanner-readability with an actual connected barcode printer where available; if no physical printer, explicitly mark device compatibility UNVERIFIED.

## Definition of done (mandatory)

A label renders, has an actual barcode, and is print-visible; Windows and browser checks pass; actual device verification separately reported.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_05.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/vinay_traders_barcode_labels_ui_board.png; see the two consolidated PDF manuals.


---

# PHASE 06 — Billing / POS and A4 customer bill

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Implement exact supplied Billing/POS look: large search, product grid/list, editable cart, customer lookup, quantity/discount/price controls, balance summary, payment method and controlled save/print workflow.
2. No GST/tax output, no tax invoice terminology. User-facing document is a BILL. Preserve existing bill IDs/numbers in storage. Correct line and cart calculations, partial payments, outstanding balances, stock decrements and concurrency.
3. Redesign customer Bill A4 portrait with actual logo, shop address/mobile/email, customer details, bill no/date, product/variant/qty/unit/rate/discount/amount, subtotal, discount, grand total, paid, due, payment method, signature and remarks. Colors from approved navy/cobalt/gold/green palette; crisp thin borders and 9pt+ legible table text.
4. In long bills, paginate and repeat headers without clipping names. Test print preview, download/share and receipt reopening, payment history and reconciling balance.
5. Use keyboard access, touch-friendly layout, maintain item source pricing on historical bills, prevent scroll-induced numeric changes.

## Definition of done (mandatory)

Invoice creation and printing match reference without GST; sale stock changes once; amounts and outstanding balances reconcile.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_06.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/vinay_traders_bill_pos_redesign_board.png, codex-handoff/VISUALS/vinay_traders_pos_redesign_showcase.png; see the two consolidated PDF manuals.


---

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


---

# PHASE 08 — Customers and customer accounts

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Redesign customer dashboard, directory, add/edit form and customer account tabs. Preserve required mobile/name, address/area, notes and all associated historical bills.
2. Show total purchased, total paid, due, credit/advance, and transaction ledger with mathematically reconciled figures. No misleading labels: number of bills is a count, purchases is an amount.
3. Add separate customer-name/mobile searches where appropriate; sorting, status, record opening, paid/partial payment recording and action logs.
4. Produce A4 customer directory/statement, billing history and account reports using logo and print-safe typography. Empty states and permissions must be real, not placeholders.
5. Test credit notes and returns against customers' balance; never double-count paid amounts.

## Definition of done (mandatory)

Customer account totals match underlying bills/payments/returns and A4 exports pass visual review.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_08.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/vinay_traders_customer_module_redesign.png, codex-handoff/VISUALS/vinay_traders_customer_account_report.png; see the two consolidated PDF manuals.


---

# PHASE 09 — Suppliers

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Apply supplier directory and account board exactly. Search supplier by separate name and mobile fields (both work together), preserve required name/mobile and optional address/notes, add/edit validation, clickable row actions.
2. Show total purchases, purchase count, outstanding credit, amount paid, last purchase and average purchase with correct labels and source calculations; no duplicate payout entries.
3. Supplier account should link purchase history, original uploaded supplier invoice, payments and credits/returns, preserving data through edits.
4. A4 supplier directory landscape; purchase history and supplier account statement portrait where readable. Follow supplied PDF examples with actual logo, print-safe colors and real saved data. Test 12+ supplier list, long names and more than one A4 page.

## Definition of done (mandatory)

Both searches, save/edit, account totals, attachment access and directory/history PDF pass.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_09.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/a_detailed_polished_ui_ux_redesign_collage_of_the.png, codex-handoff/VISUALS/a_clean_modern_saas_dashboard_ui_for_suppliers_i.png; see the two consolidated PDF manuals.


---

# PHASE 10 — Plumbers / referral partners

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Redesign plumber dashboard, directory, add/edit, profile, referred customers, referred bills, commission ledger, payments, reward jar and payout modal according to board.
2. Separate name and mobile searches; retain region, commission percent, joining date, bank/UPI fields, notes and status.
3. Compute commission from eligible saved bill amount once; apply agreed exclusions, returns and partial return recalculation. If already paid commission exceeds revised earned, show explicit carry-forward/advance rather than deleting historic payments.
4. Pay/record commission and reward jar with amount, method, date, reference and audit history. Validate available balances and prevent duplicate commission entries.
5. Provide A4 directory, referral customer/bill history, commission ledger, payouts and profile reports using supplied six PDF references.

## Definition of done (mandatory)

Referral totals, payment histories, rewards, return reversals and all A4 exports reconcile.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_10.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/Plumber_Module_Main_Design_Board.png, codex-handoff/VISUALS/Plumber_Module_Forms_Design_Board.png; see the two consolidated PDF manuals.


---

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


---

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


---

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


---

# PHASE 14 — Returns and revised bills with commission settlement

## Codex implementation request

**Implement, do not merely plan.** Inspect the existing real module, the phase-specific assets listed below, and associated models/services. Preserve saved production history and the tax-free shop billing policy. Work in `main` only after a clean, verified pull.

1. Implement a dedicated Returns module. Browse historical bills, open original, choose one or more returned line quantities, validate returnable units against already returned amounts, and confirm exactly once.
2. Persist immutable original bill AND a revised bill/return-credit record with a linked revision chain, not destructive overwrites. A4 print view must show original bill and updated bill/return adjustments below or on following A4 page, readable and labeled.
3. Returned stock increases inventory exactly once with ledger reference. Correct customer paid/due/refund, refund methods and partial refund history. If restocking condition unsuitable, track separately instead of silently adding sellable stock.
4. Recalculate plumber referral earnings and reward jar on adjusted eligible value, preserve paid payouts and show explicit overpayment carried forward. Prevent negative balances hidden as zero and duplicate refunds or returns.
5. Transactional integrity/idempotency, concurrency tests: half of item returned, entire item returned, repeated click/retry, already returned quantities, prepaid and part-paid bills, refunded and non-refunded states.
6. A4 return PDF must preserve original and adjusted bill, clear difference row/column, net amounts, refund status, signatures and actual logo.

## Definition of done (mandatory)

Stock, customer account, original/revised bill and plumber commission reconcile to ledger; duplicate return rejected.

Before calling this phase PASS, run lint, TypeScript/Vite build, relevant unit/accounting tests and browser/Electron smoke tests. For PDF-related phases, generate real printed A4 test pages and inspect long multi-page results. Document changed files, test output, UI/PDF evidence, exact git commit, and blockers in `docs/codex-qa/PHASE_14.md` and update `docs/CODEX_IMPLEMENTATION_MATRIX.md`. Do not deploy production.

**Relevant references:** codex-handoff/VISUALS/vinay_traders_bills_history_redesign.png; see the two consolidated PDF manuals.


---

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


---

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


---

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
