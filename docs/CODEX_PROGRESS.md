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

## Current implementation checkpoint (`45c7b43` on `main`, based on `641f746`)

The quotation and returns workflows now have desktop/mobile end-to-end coverage. The quotation test creates and edits a dated quote, searches by date and customer, exports an A4 PDF, and converts it into a tax-free bill. The returns test partially returns an invoice line, restores stock, checks customer and plumber commission adjustments, records the refund, and exports a before/after comparison PDF. PDF text now replaces glyphs unsupported by jsPDF's built-in Helvetica so product variants, placeholders, and footers render consistently. The return summary includes commission reversal and refund balances.

| Check | Current result | Evidence / limit |
| --- | --- | --- |
| `npm run lint` | Pass, zero warnings | Ran against this source checkpoint |
| `npm test` | Pass, 9 tests | Two Vitest files; accounting unit coverage remains narrow |
| `npm run build` with `VITE_CLIENT_RELEASE=true` | Pass | Vite reports the existing large main-bundle advisory |
| `npx playwright test --workers=2` | Pass, 32 desktop/mobile Chromium tests | Includes the new quotation and partial-return flows, along with the 28 checks listed above |
| Quotation PDF | Pass for isolated fixture | A4 portrait, logo/company header, discount and total verified; preview at `output/pdf/previews/verification-2026-11-13-updated/quotation-fixture.png` |
| Return comparison PDF | Pass for isolated fixture | A4 portrait, original and revised quantities/totals, commission reversal, refund recorded/due, and branding verified; preview at `output/pdf/previews/verification-2026-11-13-updated/return-comparison-fixture.png` |

The source/test changes and handoff references plus reviewed PDF fixtures were committed as `45c7b43` and pushed to `origin/main`. Source changes in this checkpoint: `src/utils/pdf.ts`, `tests/e2e/quotations.spec.ts`, and `tests/e2e/returns.spec.ts`. The generated PDFs and their preview PNGs are under `output/pdf/verification-2026-11-13/` and `output/pdf/previews/verification-2026-11-13-updated/`. PDFs contain isolated test data, not the owner's saved records. `codex-handoff/` now holds the reviewed manuals, images, prompts, and supplied print samples.

## Current implementation checkpoint (`07c7bae` on `main`, based on `7d44a7c`)

Pat Sanstha now has desktop/mobile end-to-end verification for creating two separately priced plans, recording both plans on the same date, updating a plan amount without altering prior expected values, and exporting daily, weekly, and monthly reports. The exported report fixtures were text-checked for A4 landscape dimensions, reporting-period rows, and totals, then rendered and visually reviewed.

| Check | Current result | Evidence / limit |
| --- | --- | --- |
| `npm run lint` | Pass, zero warnings | Includes the new Pat Sanstha browser test |
| `npm test` | Pass, 9 tests | Two Vitest files |
| `npx playwright test --workers=2` | Pass, 34 desktop/mobile Chromium tests | Full suite including all prior checks and Pat Sanstha plan/report coverage |
| Pat Sanstha reports | Pass for isolated fixtures | Daily, weekly, monthly are all one-page A4 landscape PDFs with logo and correct report-period totals. PDFs and previews are in the verification folders listed above. |

`tests/e2e/pat-sanstha.spec.ts` and its six generated report/preview fixtures were committed as `07c7bae` and pushed to `origin/main`. Full production data, migration, printer, and release gates remain unverified.

## Phase status

| Phase | Status | Commit | Current checkpoint |
| --- | --- | --- | --- |
| 00 Audit and safety baseline | IN PROGRESS | `a4a5987` | References, project map, baseline checks reviewed. No database backup/restore verification or 4-viewport baseline set. |
| 01 Shared design and data safety | IN PROGRESS | `e6837e7` | Shared branding, navigation and numeric wheel protection exist. Screen-reader, keyboard, dark-mode, sync conflict and RLS acceptance remain. |
| 02 Purchase and A4 documents | IN PROGRESS | `a4a5987` | Desktop/mobile save/reload/view attachment, unmatched supplier rejection, duplicate invoice validation, supplier-name search and three A4 PDF exports pass. A4 invoice and register PDFs visually checked at 1/20/100 rows; totals remain with the last register rows and long text wraps. Attachment cloud-storage strategy/size, Marathi fidelity, physical printer, and comparison against owner-approved saved purchase records remain. |
| 03 Inventory and catalog | IN PROGRESS | `a4a5987` | Desktop/mobile add and edit verify category, supplier/mobile, discount-aware margin and supplier filter. A4 1,552-product report has visible calculated amount and final totals. Historical source page-by-page reconciliation, product import review and further stock-ledger/variant cases remain. |
| 04 Quotations | IN PROGRESS | `45c7b43` | Desktop/mobile create, edit, date/customer search, A4 PDF, and conversion to a tax-free bill pass. Long-table pagination and more status/edit cases remain. |
| 05 Barcode labels | IN PROGRESS | `e6837e7` | Code 128 generation, SVG download and print surface exist. Device and sheet-print verification remain. |
| 06 Billing / POS | IN PROGRESS | `e6837e7` | Tax-free bill creation and A4 print surface exist. Complete financial workflow and PDF review remain. |
| 07 Bills and history | IN PROGRESS | `45c7b43` | Partial return creates a revised bill and refund/payment history; broader bill edit/view/filter cases and payment reconciliation remain. |
| 08 Customers | IN PROGRESS | `e6837e7` | Directory, profiles, ledger, payments and plumber references exist. Search, account math and document acceptance remain. |
| 09 Suppliers | IN PROGRESS | `e6837e7` | Separate name/mobile search, account and purchase history exist. Form validation, payment and PDF acceptance remain. |
| 10 Plumbers | IN PROGRESS | `e6837e7` | Referral, commission, reward and payment history exist. Return reversal/carry-forward acceptance remains. |
| 11 Workers / payroll | IN PROGRESS | `a4a5987` | Desktop/mobile tests verify settlement zeroes remaining base pay and preserves payment history, and bonus amount/date bounds persist. Broader pay-cycle, partial payment and payslip cases remain. |
| 12 Attendance | IN PROGRESS | `a4a5987` | Desktop/mobile monthly bulk test preserves recorded statuses and skips future dates. Daily/month grid editing, leave, payroll links and A4 reports remain. |
| 13 Pat Sanstha | IN PROGRESS | `07c7bae` | Desktop/mobile test verifies two plan-specific amounts on one date, past expected values remain unchanged after a plan rate change, and daily/weekly/monthly A4 report totals. Duplicate edit semantics and extended period boundaries remain. |
| 14 Returns | IN PROGRESS | `45c7b43` | Desktop/mobile partial return verifies stock reversal, customer and plumber commission adjustment, refund payment, and a branded A4 before/after PDF. Full return, repeat-return caps, restock-off, and broader settlement cases remain. |
| 15 Expenses | IN PROGRESS | `e6837e7` | Personal/shop classification and three export actions exist. CRUD, date filters and totals remain to verify. |
| 16 Dashboard / shared operations | IN PROGRESS | `e6837e7` | Dashboard, settings, notifications and report exports exist. All period boundaries, navigation and device views remain to verify. |
| 17 Windows and web release | IN PROGRESS | `e6837e7` | Build/release workflows exist. Installer, actual device verification and authorized deployment are outstanding. |

## Current implementation activity

- Continue from the earliest incomplete phase, fixing evidenced defects and adding regression coverage.
- Next targeted work: verify same-day deposits across multiple Pat Sanstha plans and their period reports, then continue through the remaining incomplete modules and release gates.
- Maintain the production boundary: no database mutation, RLS cutover, production web deploy, or overwrite of local business data.

## Remaining release gates

- Full acceptance testing across all modules, including realistic isolated fixtures and edit/view/delete/filter/export flows.
- Generate and visually inspect the actual A4 purchase invoice, register, product report, customer bill, quotation, returns, worker payslip and finance reports, including multi-page and long-text cases.
- Verify UI at 1366x768, 1024x768, 375x812 and 320x700, in light and dark modes, with no clipped tables or controls.
- Build and launch Windows installer/portable executable for this source commit; verify printing on the intended printer.
- Verify backup/restore, owner access and staging RLS before any production security change; resolve cloud conflict/attachment storage risks.
- Prepare a web build and Cloudflare instructions. Production deployment remains explicitly gated.
