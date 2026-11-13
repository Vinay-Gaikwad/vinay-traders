# Vinay Traders implementation progress

**Work branch:** `main` — **Baseline commit:** `e6837e7` — **Last reviewed:** 13 November 2026
**Overall state:** IN PROGRESS — do not use this document as a production release sign-off.

This tracker separates code that exists from behavior that has passed acceptance. It records this checkout's baseline and the current verification limits. Production data and Supabase policies were not changed.

## Reference review

- Read the master prompt, section-by-section prompts, all 18 phase prompts, manifest, additions, status/release documents, and security notes in `codex-handoff/` and `docs/`.
- Visually reviewed all 26 pages in both reference manuals, all 30 visual files (including the logo), and the supplied purchase, supplier, and plumber PDF samples.
- Found all four original 2021 price-list PDFs in the user's Downloads folder, despite the handoff manifest saying they were unavailable. They are source evidence for historic catalogue entries; they do not establish current stock or current prices.
- The repository already has `src/assets/price-list-catalog.json`: 1,528 entries with source PDF/page/effective date, zero stock, and a Finolex supplier link. Category counts: ASTM 399, CPVC 316, Agri 406, SWR 407. Keep the historical provenance visible and do not promote 2021 prices as current prices.
- The visual example showing GST is overridden by the user's explicit tax-free billing requirement. Customer documents must say “Bill”, with no GST calculation or tax-invoice wording.

## Baseline checks

These checks ran on the pre-change source at `e6837e7`, with offline/local data. They are smoke checks, not phase sign-off.

| Check | Result | Evidence / limit |
| --- | --- | --- |
| `npm run lint` | Pass with one React Hook Form compiler warning | `src/features/backoffice/index.tsx:56`, `form.watch('purchaseRate')` |
| `npm run build` | Pass | Vite reports a large main bundle; no build error |
| `npm test` | Pass, 9 tests | 2 Vitest files; accounting regression coverage is narrow |
| `npx playwright test` | Pass, 8 tests | Offline web preview; 17 route smoke checks across 1440px desktop and 390px mobile plus purchase wheel / bill A4 / barcode print surface checks |
| Windows Electron installer | Not run | No Windows install smoke result for this source commit |
| Production Supabase / Cloudflare | Not run | Intentionally outside this implementation pass; release requires separate security and deployment authorization |

Playwright captures are under ignored `test-results/` from the baseline run. Visual review found an inventory register that can extend beyond the 1440px viewport, so the full data-table sizing and mobile table interaction still need focused verification.

## Current implementation checkpoint (`a4a5987` on `main`, based on `e6837e7`)

The next implementation slice fixes the purchase supplier lookup accepting stale IDs, makes discounted selling price part of inventory margin, and prevents monthly bulk attendance from replacing existing statuses or marking future dates. Regression coverage now checks those workflows on desktop and mobile. The purchase PDFs have been visually inspected after rendering to images, including the last page of the 1,552-row report and the final pages of 100-row invoice/register fixtures.

| Check | Current result | Evidence / limit |
| --- | --- | --- |
| `npm run lint` | Pass, zero warnings | Ran after the final 28-test Playwright run |
| `npm test` | Pass, 9 tests | Two Vitest files; accounting unit coverage remains narrow |
| `npm run build` | Pass | Offline/local release build; large main-bundle advisory remains |
| `npx playwright test --workers=2` | Pass, 28 tests | Desktop and mobile Chromium; route smoke, input wheel, bill/label print surface, purchase save/reload/attachment/search/duplicate validation/PDFs/long rows, inventory supplier/category/margin, worker payroll/bonus and attendance boundary flows |
| Purchase PDFs | Pass for tested fixtures | A4 portrait invoice (1, 2, and 8 pages for 1/20/100 long-text rows), A4 landscape register (1, 2, and 6 pages for 2/20/100 records), A4 landscape product report (71 pages / 1,552 products); logo repeats on every page, totals accompany final register rows, amount and totals are correct, no raw JSON. Marathi fidelity and physical printer output remain unverified. |

The source changes for this checkpoint are committed as `a4a5987`. `test-results/` contains ignored Playwright fixture artifacts. Copied, reviewed fixture PDFs are in `output/pdf/verification-2026-11-13/`, with first/last-page PNGs in `output/pdf/previews/verification-2026-11-13-updated/`; the earlier preview files are preserved.

## Phase status

| Phase | Status | Commit | Current checkpoint |
| --- | --- | --- | --- |
| 00 Audit and safety baseline | IN PROGRESS | `a4a5987` | References, project map, baseline checks reviewed. No database backup/restore verification or 4-viewport baseline set. |
| 01 Shared design and data safety | IN PROGRESS | `e6837e7` | Shared branding, navigation and numeric wheel protection exist. Screen-reader, keyboard, dark-mode, sync conflict and RLS acceptance remain. |
| 02 Purchase and A4 documents | IN PROGRESS | `a4a5987` | Desktop/mobile save/reload/view attachment, unmatched supplier rejection, duplicate invoice validation, supplier-name search and three A4 PDF exports pass. A4 invoice and register PDFs visually checked at 1/20/100 rows; totals remain with the last register rows and long text wraps. Attachment cloud-storage strategy/size, Marathi fidelity, physical printer, and comparison against owner-approved saved purchase records remain. |
| 03 Inventory and catalog | IN PROGRESS | `a4a5987` | Desktop/mobile add and edit verify category, supplier/mobile, discount-aware margin and supplier filter. A4 1,552-product report has visible calculated amount and final totals. Historical source page-by-page reconciliation, product import review and further stock-ledger/variant cases remain. |
| 04 Quotations | IN PROGRESS | `e6837e7` | Date/customer search and vector A4 PDF exist. Create/edit/convert and long-table print review remain. |
| 05 Barcode labels | IN PROGRESS | `e6837e7` | Code 128 generation, SVG download and print surface exist. Device and sheet-print verification remain. |
| 06 Billing / POS | IN PROGRESS | `e6837e7` | Tax-free bill creation and A4 print surface exist. Complete financial workflow and PDF review remain. |
| 07 Bills and history | IN PROGRESS | `e6837e7` | Customer/date filters and payment action exist. Edit/view/return reconciliation and mobile acceptance remain. |
| 08 Customers | IN PROGRESS | `e6837e7` | Directory, profiles, ledger, payments and plumber references exist. Search, account math and document acceptance remain. |
| 09 Suppliers | IN PROGRESS | `e6837e7` | Separate name/mobile search, account and purchase history exist. Form validation, payment and PDF acceptance remain. |
| 10 Plumbers | IN PROGRESS | `e6837e7` | Referral, commission, reward and payment history exist. Return reversal/carry-forward acceptance remains. |
| 11 Workers / payroll | IN PROGRESS | `a4a5987` | Desktop/mobile tests verify settlement zeroes remaining base pay and preserves payment history, and bonus amount/date bounds persist. Broader pay-cycle, partial payment and payslip cases remain. |
| 12 Attendance | IN PROGRESS | `a4a5987` | Desktop/mobile monthly bulk test preserves recorded statuses and skips future dates. Daily/month grid editing, leave, payroll links and A4 reports remain. |
| 13 Pat Sanstha | IN PROGRESS | `e6837e7` | Multiple plans and plan-specific amounts exist. Same-day plan entries and period reports need end-to-end review. |
| 14 Returns | IN PROGRESS | `e6837e7` | Revised bills, stock reversal, refund ledger and plumber adjustment code exist. Partial/full return and financial reconciliation remain. |
| 15 Expenses | IN PROGRESS | `e6837e7` | Personal/shop classification and three export actions exist. CRUD, date filters and totals remain to verify. |
| 16 Dashboard / shared operations | IN PROGRESS | `e6837e7` | Dashboard, settings, notifications and report exports exist. All period boundaries, navigation and device views remain to verify. |
| 17 Windows and web release | IN PROGRESS | `e6837e7` | Build/release workflows exist. Installer, actual device verification and authorized deployment are outstanding. |

## Current implementation activity

- Continue from the earliest incomplete phase, fixing evidenced defects and adding regression coverage.
- Next targeted work: reconcile the historic inventory catalog against original pages, add focused stock-ledger/product-variant checks, then advance to quotations and barcodes.
- Maintain the production boundary: no database mutation, RLS cutover, production web deploy, or overwrite of local business data.

## Remaining release gates

- Full acceptance testing across all modules, including realistic isolated fixtures and edit/view/delete/filter/export flows.
- Generate and visually inspect the actual A4 purchase invoice, register, product report, customer bill, quotation, returns, worker payslip and finance reports, including multi-page and long-text cases.
- Verify UI at 1366x768, 1024x768, 375x812 and 320x700, in light and dark modes, with no clipped tables or controls.
- Build and launch Windows installer/portable executable for this source commit; verify printing on the intended printer.
- Verify backup/restore, owner access and staging RLS before any production security change; resolve cloud conflict/attachment storage risks.
- Prepare a web build and Cloudflare instructions. Production deployment remains explicitly gated.
