# Vinay Traders implementation matrix

**Baseline commit:** `e6837e7` (`main`) — **Reviewed:** 13 November 2026
**Status key:** `NOT STARTED`, `IN PROGRESS`, `BLOCKED`, `TESTED`, `VERIFIED`. A phase is not `VERIFIED` just because code is present or a build passes.

**Current checkpoint:** `45c7b43` on `main`, based on `641f746`; phase rows below retain `IN PROGRESS` until their full acceptance lists pass. Current focused results are recorded after the baseline section.

| Phase | Source observed | Main gaps / acceptance checks | Visual / PDF reference | Commit | Status |
| --- | --- | --- | --- | --- | --- |
| 00 Audit, backup and baseline | React/Electron project, local and Supabase data services, 18 phase prompts, reference guides, route smoke suite | Record 4 viewport baselines; test backup/restore only with owner-provided copy; do not touch production. Document rollback and artifact evidence. | `VISUALS/a_large_clean_modern_ui_design_system_dashboard.png`; UI and A4 manuals | `a4a5987` | IN PROGRESS |
| 01 Shared UI, safety and cloud | Shared theme/nav, responsive shell, number input protection, offline mode, revision-checked cloud state | Test keyboard/accessibility, light/dark, all viewport widths, scroll wheel over every numeric form, offline/reconnect and conflict path. RLS staging/owner gate remains. | Foundation visuals; UI manual | `e6837e7` | IN PROGRESS |
| 02 Purchase / purchase PDFs | Purchase editor, attachment data URL validation/viewer, register search, invoice/register/product PDF functions | Create/attach/save/reload/view; validate duplicate supplier invoice and calculations; exercise 1/20/100 rows, long names, multiple pages, logo/repeated headers, A4 size and margins. Assess 2MB base64 limit and secure cloud attachment storage. | Purchase redesign board; purchase invoice/register/product PDF samples; A4 manual | `a4a5987` | IN PROGRESS |
| 03 Inventory/catalog | Product supplier/category, margin after discount, supplier filter, stock ledger, historical catalog JSON (1,528 zero-stock entries) | Reconcile every source page/entry; preserve 2021 price provenance; verify add/edit, variants, supplier/mobile labels, margin arithmetic, supplier group/filter and responsive table; test amount column in A4 product report. | Inventory UI board; four user 2021 price-list PDFs; product report sample | `a4a5987` | IN PROGRESS |
| 04 Quotations | Create/edit, date and text search, status, convert-to-bill, vector PDF | Create/edit/date/customer search/A4 export/bill conversion pass on desktop and mobile. Verify long records and additional status/edit cases. | Quotation board and portrait sample; A4 manual | `45c7b43` | IN PROGRESS |
| 05 Barcode labels | Unit-aware Code 128 generation, SVG download, print-only label sheet | Verify uniqueness, visible preview, scanned value, print size/sheet layout on target printer and mobile workflow. | Barcode workflow board | `e6837e7` | IN PROGRESS |
| 06 Billing / POS | Customer/product flow, payments, stock deduction, tax-free Bill print surface | Test create/edit/draft/pay/view/print, discount and stock calculations, customer balance, no tax fields/terms; fit A4 and long item tables. | Billing board and Retail Bill sample | `e6837e7` | IN PROGRESS |
| 07 Bills and history | Search by customer/date, bill detail, payment and edit actions | A partial-return test verifies revised bill/refund history and linked balances. Verify remaining all-bills, draft/paid/due, payment duplication, print, and mobile cases. | Bills & History board | `45c7b43` | IN PROGRESS |
| 08 Customers | Directory, credit profile, bill/payment/ledger tabs, plumber reference | Verify CRUD, balances and opening balance edits, mobile search, filters, statement/report layout. | Customer board and Customer Account Report sample | `e6837e7` | IN PROGRESS |
| 09 Suppliers | Directory, separate name/mobile inputs, account and purchase history | Verify CRUD, supplier payment bounds, KPI totals, purchase integration, account reports, mobile table. | Supplier boards and 3 supplier PDF samples | `e6837e7` | IN PROGRESS |
| 10 Plumbers | Partner directory, referrals, commissions, reward jar, payout, return adjustment | Verify mobile/name search, commission calculations and payout; partially returned bills and overpaid carry-forward; PDF reports. | Plumber boards and 6 report samples | `e6837e7` | IN PROGRESS |
| 11 Workers/payroll | Worker profile, attendance, salary history, period bonus, payment, PDF payslip | Verify monthly/daily wages, bonus interval boundaries, advances/deductions, repeated/partial payment, zero remaining after settlement, historical payroll and A4 payslip. | Worker/payroll boards and payslip samples | `a4a5987` | IN PROGRESS |
| 12 Attendance | Daily attendance confirmation, monthly matrix/summary | Verify date selection, status edits, month boundary, no unintended future attendance, payroll impact and A4 reports. | Attendance boards and report sample | `a4a5987` | IN PROGRESS |
| 13 Pat Sanstha | Multiple named deposit plans, separate daily amounts, plan-specific entries and reports | Verify two deposits on one date for distinct plans, duplicate same-plan guard, edits affecting only future expected values, daily/weekly/monthly totals, A4. | Pat Sanstha boards and PDF sample | `e6837e7` | IN PROGRESS |
| 14 Returns | Original/revised bill, return lines, stock restore, refund and commission adjustment | Partial return passes on desktop/mobile with stock, customer, plumber commission, and refund reconciliation plus branded A4 comparison PDF. Verify full return, repeated-return cap, restock toggle, and broader ledger cases. | Return requirements and Bill reference | `45c7b43` | IN PROGRESS |
| 15 Expenses | Personal/shop entry types, ledger, separate and overall PDF actions | Verify create/edit/delete, date and type search, totals, payment method, reports and persistence. | Dashboard/report reference; A4 manual | `e6837e7` | IN PROGRESS |
| 16 Dashboard, reports and shell | Dashboard analytics, period exports, notifications, settings, navigation; legacy reports route removed | Verify local-time period boundaries, filters, navigation, notification read state, role/settings behavior, responsive shell and no unintended report page. | Dashboard/UI boards; A4 manual | `e6837e7` | IN PROGRESS |
| 17 Release and deployment prep | CI, web build, Electron builder, manual gated deploy workflow | Build EXE/portable from exact commit, launch on Windows, test printer; prepare production web build/instructions. Supabase RLS, Cloudflare credentials and release remain owner/approval gated. | Release requirements | `e6837e7` | IN PROGRESS |

## Baseline verification records

- `npm run lint`: exit 0; one compiler warning in `src/features/backoffice/index.tsx:56` for the `react-hook-form` watch result.
- `npm run build`: passed; emitted a >500kB chunk advisory.
- `npm test`: 9 passing tests across two files.
- `npx playwright test`: 8 passing Chromium tests across 1440×900 and 390×844 offline previews, including route smoke, number wheel, tax-free bill print surface, and barcode print surface.
- No Windows installer, printer, staging authorization, Supabase mutation, or production deployment was attempted.

Visual captures from the baseline run remain in ignored `test-results/`. Do not remove user-provided untracked reference assets or pre-existing PDF preview files.

## Current focused verification records (`a4a5987` checkpoint)

- `npm run lint`: pass, zero warnings.
- `npm test`: pass, 9 tests across two Vitest files.
- `npm run build` with `VITE_CLIENT_RELEASE=true`: pass; Vite emitted only the existing large-chunk advisory.
- `npx playwright test --workers=2`: pass, 28 desktop/mobile Chromium tests. Added purchase attachment/save/reopen/search/validation/PDF pagination flows, inventory add/edit category/supplier/discount margin flow, worker settlement/payment history and period bonus, and attendance status/future-date regression flows.
- Purchase PDF fixtures: invoice A4 portrait (1, 2, and 8 pages for 1/20/100 long-text rows); register A4 landscape (1, 2, and 6 pages for 2/20/100 records, with summary on the final table page); product report A4 landscape (71 pages / 1,552 rows). The report retains a readable table, correct first-row amount, final-page totals, and no raw JSON. These are isolated fixtures, not exports of the owner's saved business data.
- Rendered and reviewed PNG previews: `output/pdf/previews/verification-2026-11-13-updated/` (standard invoice, register, product report first/last pages, and 20/100-row invoice/register first/last pages). Copied fixture PDFs: `output/pdf/verification-2026-11-13/`.
- Modified source files: `src/features/backoffice/index.tsx`, `src/features/workers/index.tsx`, `src/utils/pdf.ts`; added `tests/e2e/purchase-workflow.spec.ts`, `tests/e2e/inventory-product.spec.ts`, and `tests/e2e/worker-payroll.spec.ts`.
- Not attempted: Windows installer/portable verification, physical printer check, Marathi text fidelity, comparison against owner-approved saved records, production Supabase/Cloudflare changes.

## Current focused verification records (`45c7b43` checkpoint)

- `npm run lint`: pass, zero warnings.
- `npm test`: pass, 9 tests across two Vitest files.
- `npm run build` with `VITE_CLIENT_RELEASE=true`: pass; Vite emitted the existing large-chunk advisory.
- `npx playwright test --workers=2`: pass, 32 desktop/mobile Chromium tests.
- Quotation E2E: create/edit, date range and customer search, vector A4 PDF, and conversion to a tax-free invoice passed on desktop and mobile. The A4 portrait fixture includes the logo, customer and validity details, discounted line amount, and grand total; see `output/pdf/verification-2026-11-13/quotation-fixture-a4.pdf` and its PNG preview.
- Returns E2E: partial line return, revised bill, stock restoration, customer balance, plumber referral/commission adjustment, refund record, and A4 before/after PDF passed on desktop and mobile. Preview includes commission reversed and refund recorded/due; see `output/pdf/verification-2026-11-13/return-comparison-fixture-a4.pdf` and its PNG preview.
- Source/test changes and all supplied `codex-handoff/` references and `output/pdf/` verification fixtures/previews were committed as `45c7b43` and pushed to `origin/main`.
- Not attempted: production data access, Supabase security changes, production deployment, Windows installer/portable verification, or physical printer verification.
