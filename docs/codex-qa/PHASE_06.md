# Phase 06 — Billing / POS and A4 customer bill

**Status:** IN PROGRESS
**Source checkpoint:** `31f9e60`
**Recorded:** 13 November 2026

## Completed in this checkpoint

- Resume keeps the saved draft instead of deleting it; completion replaces that same ID and bill number.
- Loading a saved bill/quotation replaces cart metadata. Source loading happens once per route, preventing a successful save from repopulating the cleared cart.
- Credit validation includes the customer's full previous balance when completing a draft. Only replacing a completed bill subtracts its old due amount first.
- Completed bills cannot be changed to Draft/Held. Revised/Returned records cannot be overwritten through normal billing; UI edit/payment controls reflect those restrictions.
- Existing bill date and preparer survive edits. Quotation source is saved on a draft and conversion happens only on completion. A return points the quotation at the current revised bill.
- Discounted partial payment and later settlement retain the initial payment and one linked account receipt, preserve customer balance, and consume stock once.
- A4 bills have independent named pages, 12 mm margins, proportioned columns, 9 pt table/variant text, due dates, round-off values, page numbers, repeated table headers and no trailing blank page. Logo, shop details, terms and signature remain visible.

## Changed source and tests

- `src/features/billing/index.tsx`
- `src/features/billing/store.ts`
- `src/features/billing/parts.tsx`
- `src/styles/bill-document.css`
- `src/services/operations.ts`
- `src/services/operations.test.ts`
- `src/types/index.ts`
- `tests/e2e/billing-drafts.spec.ts`
- `tests/e2e/print-and-payments.spec.ts`

The optional quotation source field persists with the existing local/cloud JSON snapshot format. No normalized-table migration was added or applied, and real cloud synchronization was not tested.

## Test results

| Check | Result | Scope / limit |
| --- | --- | --- |
| `npm run lint` | Pass, zero warnings | Final source/test changes |
| `npm test` | Pass, 17 tests | Eight added cases cover credit limits, completion/resave stock/accounting, invalid state transitions, immutable return history and quote draft identity/linkage |
| Client release `npm run build` | Pass | TypeScript/Vite; existing >500 KB bundle advisory |
| `npx playwright test --workers=2` | Pass, 40 tests | Full desktop/mobile suite before final print typography/blank-page corrections |
| Focused billing/print/quotation/return suite | Pass, 14 tests | Final source after print corrections; both configured Chromium viewports |

Intermediate test failures were fixture/selector mismatches and were corrected. Actual print review then caught edge-to-edge margins, omitted round off and a blank final page; these were fixed and the final relevant suite rerun.

## Evidence

PDFs (isolated fixtures):

- `output/pdf/verification-2026-11-13/billing-partial-a4.pdf`
- `output/pdf/verification-2026-11-13/customer-bill-60-rows-a4.pdf`

Previews in `output/pdf/previews/verification-2026-11-13-updated/`:

- `billing-partial-a4.png`
- `customer-bill-60-rows-a4-first.png`
- `customer-bill-60-rows-a4-continuation.png`
- `customer-bill-60-rows-a4-final.png`
- `billing-resumed-draft-desktop.png`
- `billing-settled-history-mobile.png`

The partial bill is one A4 portrait page, with subtotal ₹184.00, discount ₹18.40, round off ₹0.40, total ₹166.00, paid ₹20.00 and due ₹146.00. The long bill is seven A4 portrait pages with all 60 long-description rows, repeated table headers, total ₹5,400.00, paid ₹1,250.00 and due ₹4,150.00. Dimensions are 594.96 × 841.92 pt. PDF text checks confirm nonempty pages and totals; first/continuation/final pages were rendered and visually inspected.

## Remaining acceptance

- Mixed payments, cash change, payment editing, and completed-bill edits after later account receipts need focused financial reconciliation.
- Newly generated numbers currently add a separator even when the configured prefix ends in a hyphen; normalize new numbers while preserving all saved numbers in the next slice.
- More long customer/address/remarks, Marathi content, dark mode and four required viewport sizes remain.
- Electron runtime/print-dialog and physical printer output are unverified.
- Concurrency, staging cloud synchronization, backup/restore and release acceptance remain separate gates.

Phase 06 is not VERIFIED. Production deployment, Supabase security and important local business data were not modified.
