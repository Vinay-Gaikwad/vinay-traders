# Vinay Traders implementation matrix

**Baseline commit:** `e6837e7` (`main`) — **Reviewed:** 13 November 2026
**Status key:** `NOT STARTED`, `IN PROGRESS`, `BLOCKED`, `TESTED`, `VERIFIED`. A phase is not `VERIFIED` just because code is present or a build passes.

**Current checkpoint:** `31f9e60` on `main`, after barcode checkpoint `69492f2`; phase rows retain `IN PROGRESS` until full acceptance passes. Current focused results are recorded after the baseline section.

| Phase | Source observed | Main gaps / acceptance checks | Visual / PDF reference | Commit | Status |
| --- | --- | --- | --- | --- | --- |
| 00 Audit, backup and baseline | React/Electron project, local and Supabase data services, 18 phase prompts, reference guides, route smoke suite | Record 4 viewport baselines; test backup/restore only with owner-provided copy; do not touch production. Document rollback and artifact evidence. | `VISUALS/a_large_clean_modern_ui_design_system_dashboard.png`; UI and A4 manuals | `a4a5987` | IN PROGRESS |
| 01 Shared UI, safety and cloud | Shared theme/nav, responsive shell, number input protection, offline mode, revision-checked cloud state | Test keyboard/accessibility, light/dark, all viewport widths, scroll wheel over every numeric form, offline/reconnect and conflict path. RLS staging/owner gate remains. | Foundation visuals; UI manual | `e6837e7` | IN PROGRESS |
| 02 Purchase / purchase PDFs | Purchase editor, attachment data URL validation/viewer, register search, invoice/register/product PDF functions | Create/attach/save/reload/view; validate duplicate supplier invoice and calculations; exercise 1/20/100 rows, long names, multiple pages, logo/repeated headers, A4 size and margins. Assess 2MB base64 limit and secure cloud attachment storage. | Purchase redesign board; purchase invoice/register/product PDF samples; A4 manual | `a4a5987` | IN PROGRESS |
| 03 Inventory/catalog | Product supplier/category, margin after discount, supplier filter, stock ledger, historical catalog JSON (1,528 zero-stock entries) | Reconcile every source page/entry; preserve 2021 price provenance; verify add/edit, variants, supplier/mobile labels, margin arithmetic, supplier group/filter and responsive table; test amount column in A4 product report. | Inventory UI board; four user 2021 price-list PDFs; product report sample | `a4a5987` | IN PROGRESS |
| 04 Quotations | Create/edit, date and text search, status, convert-to-bill, vector PDF | Create/edit/date/customer search/A4 export/bill conversion pass on desktop and mobile. Verify long records and additional status/edit cases. | Quotation board and portrait sample; A4 manual | `45c7b43` | IN PROGRESS |
| 05 Barcode labels | Complete builder/history, unique unit Code 128, SVG and isolated A4 sheet | Desktop/mobile generation/search and 16+2 A4 pagination pass. Physical printer/scanner and Electron are unverified. See PHASE_05 QA. | Barcode workflow board | `69492f2` | IN PROGRESS |
| 06 Billing / POS | Preserved draft identity/cart metadata, credit bounds, transition/history guards, quote source, partial settlement, named A4 pages | Desktop/mobile draft/partial-payment flows and 1-/7-page bills pass. Verify mixed/cash change, completed edits after receipts, prefix separator, all viewports and Electron/printer. See PHASE_06 QA. | Billing board and Retail Bill sample | `31f9e60` | IN PROGRESS |
| 07 Bills and history | Date/customer search, bill detail, partial settlement, immutable returned history | Initial/later receipts and no duplicate stock pass. Broader filters, bill-number search, full edit/payment reconciliation remain. | Bills & History board | `31f9e60` | IN PROGRESS |
| 08 Customers | Directory, credit profile, bill/payment/ledger tabs, plumber reference | Verify CRUD, balances and opening balance edits, mobile search, filters, statement/report layout. | Customer board and Customer Account Report sample | `e6837e7` | IN PROGRESS |
| 09 Suppliers | Directory, separate name/mobile inputs, account and purchase history | Verify CRUD, supplier payment bounds, KPI totals, purchase integration, account reports, mobile table. | Supplier boards and 3 supplier PDF samples | `e6837e7` | IN PROGRESS |
| 10 Plumbers | Partner directory, referrals, commissions, reward jar, payout, return adjustment | Verify mobile/name search, commission calculations and payout; partially returned bills and overpaid carry-forward; PDF reports. | Plumber boards and 6 report samples | `e6837e7` | IN PROGRESS |
| 11 Workers/payroll | Worker profile, attendance, salary history, period bonus, payment, PDF payslip | Verify monthly/daily wages, bonus interval boundaries, advances/deductions, repeated/partial payment, zero remaining after settlement, historical payroll and A4 payslip. | Worker/payroll boards and payslip samples | `a4a5987` | IN PROGRESS |
| 12 Attendance | Daily attendance confirmation, monthly matrix/summary | Verify date selection, status edits, month boundary, no unintended future attendance, payroll impact and A4 reports. | Attendance boards and report sample | `a4a5987` | IN PROGRESS |
| 13 Pat Sanstha | Multiple named deposit plans, separate daily amounts, plan-specific entries and reports | Desktop/mobile verifies two plans depositing separately on one date, old expected amounts remain fixed after a plan rate change, and daily/weekly/monthly A4 report totals. Confirm same-plan edit behavior and more period-boundary cases. | Pat Sanstha boards and PDF sample | `07c7bae` | IN PROGRESS |
| 14 Returns | Original/revised bill, stock/refund/commission, protected history, quotation revision link | Partial-return E2E still passes; unit coverage checks history protection and quote link after return. Full/repeat/restock-off/settlement cases remain. | Return requirements and Bill reference | `31f9e60` | IN PROGRESS |
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

## Current focused verification records (`07c7bae` checkpoint)

- `npm run lint`: pass, zero warnings.
- `npm test`: pass, 9 tests across two Vitest files.
- `npx playwright test --workers=2`: pass, 34 desktop/mobile Chromium tests.
- Pat Sanstha browser coverage creates two plan-specific daily amounts, records each plan on the same date, confirms an edited plan rate does not rewrite earlier expected amounts, and exports Daily, Weekly, and Monthly reports. A4 landscape dimensions and period totals were checked in the fixture PDFs; the logo, table, and totals were visually reviewed in their PNG previews.
- Added `tests/e2e/pat-sanstha.spec.ts` and the three isolated A4 report fixtures/previews, committed and pushed as `07c7bae`.
- No installer, production data mutation, Supabase security change, printer test, or production deployment was attempted.

## Current focused verification records (`69492f2` checkpoint)

- Lint: zero warnings; unit tests: 9 passed; client release build: passed with existing bundle advisory; focused bill/barcode browser suite: 4 passed.
- Barcode fixture is 2 A4 portrait pages containing 16 + 2 labels. Logo, values, unit/price/shelf text and page previews were inspected. SVG download and barcode lookup in billing pass on desktop/mobile.
- `docs/codex-qa/PHASE_05.md` records source files, artifacts and unverified physical-device/Electron acceptance.

## Current focused verification records (`31f9e60` checkpoint)

- Lint: zero warnings; accounting unit suite: 17 passed; client release TypeScript/Vite build: passed with existing bundle advisory.
- Full desktop/mobile Playwright suite: 40 passed before final print corrections; final related billing/print/quotation/return suite: 14 passed after those corrections.
- Draft resume preserves ID/number and saved data, clears an unrelated quotation cart and consumes stock once on completion. Partial checkout applies 10% discount, rounds ₹165.60 to ₹166.00, receives ₹20.00 and later settles ₹146.00 with a single receipt and no second stock deduction.
- A4 PDFs: partial bill is 1 page; 60 long-description rows use 7 portrait pages. Text checks confirm all rows, repeated column headers, final totals and no empty pages. Reviewed first/continuation/final PNGs and UI captures are in the verification preview directory.
- `docs/codex-qa/PHASE_06.md` lists changed files, exact source checkpoint, evidence and remaining acceptance. No production data/security/deployment or physical printer changes were made.
