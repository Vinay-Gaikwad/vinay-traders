# Vinay Traders — Release handoff and remaining work

**Status: NOT APPROVED FOR PRODUCTION RELEASE.** Source-level implementation is underway. Passing TypeScript, lint, mock-data tests and route smoke checks does not prove production accounting, shop inventory, Windows installation, or Supabase authorization.

## Changes committed on `main` during the current work session

- Fixed legacy GST settings affecting new customer bill calculations; new bills remain tax-free.
- Fixed separate Pat Sanstha daily deposit amounts, same-day entries, per-plan amount editing, and monthly summary/report labels. Historical entries are not rewritten when daily plan amounts change.
- Added automated regressions for tax-free bills, plan-specific deposits, expenses, attendance, worker period bonus, and commission adjustment after a returned referral bill.
- Corrected barcode printing by rendering a separate 50 × 30 mm label surface. Printer paper must be selected on the actual device; a printer compatibility test is outstanding.
- Updated customer-facing Bill terminology and A4 invoice styling while preserving existing saved invoice numbers.
- Added a plumber return-adjustments tab and explicit commission overpayment/carry-forward indicator; previously paid commission remains in the audit history.
- Corrected dashboard daily/weekly/monthly/yearly report calendar boundaries to use the shop's local date instead of UTC.
- Existing shared design references and implementation status are in `docs/IMPLEMENTATION_STATUS.md`.

## Already present in source code, still requiring end-to-end acceptance

- Phase 04 Quotations: date search and vector A4 PDFs.
- Phase 05 Barcode generator: unit-specific labels and Code 128 values.
- Phase 06 Billing: customer bills, payment forms, invoicing stock deduction.
- Phase 07 Bills and history: date and customer search, bill opening/printing.
- Phase 08 Customer accounts: profiles, balances, bill and payment histories.
- Phase 09 Supplier accounts: name/mobile search and supplier purchase records.
- Phase 10 Plumber referrals: commission, payment, rewards and return adjustments.
- Phase 11 Worker payroll: bonuses by date range, per-period payments and payslip exports.
- Phase 12 Attendance: daily and monthly views.
- Phase 13 Pat Sanstha: multiple organizations with separate daily amounts.
- Phase 14 Returns: original/revised bills, inventory restocking, commission reductions and refunds.
- Phase 15 Expenses: personal, shop and combined reports.
- Phase 16 Dashboard: daily, weekly, monthly and yearly shop summaries.
- Phase 17 Release workflows: web validation, responsive smoke tests, Windows EXE build and gated Cloudflare deployment.

The words **present in source** mean functionality needs acceptance testing and potentially further fixes; they do not mean verified complete.

## Critical release blockers (all must be resolved before Cloudflare release)

1. **Supabase production access:** The original migrations use broad `anon` RLS policies. The safe manual cutover at `docs/security/README.md` requires an owner account, membership record, tested backup, and staging verification. Never automatically deploy or execute the cutover.
2. **Inventory source catalog:** Four 2021 supplier price-list PDFs have been found in the user's Downloads folder and imported as 1,528 source-attributed, historical, zero-stock catalogue rows. Reconcile all extracted rows visually and confirm current rates/stock before using the entries for live purchasing; never represent 2021 prices as current.
3. **Cross-device Windows/cloud sync:** Normal Windows EXE uses `VITE_CLIENT_RELEASE=true` and is local-only. Shared cloud desktop storage needs approved security review, authentication testing and conflict resolution. Do not imply Windows and web data synchronize until proven.
4. **PDF and printer acceptance:** Test actual A4 purchase, quotation, bill, return, worker payslip and financial report exports with 1 / 20 / 100+ rows, long names, Marathi, page headers, logo, currency and A4 paper margins. Test barcode labels with the actual label printer.
5. **Financial acceptance:** Reconcile real purchasing stock, supplier payments, customer balances, plumber commission carry-forwards, refunds, worker pay/bonus, and Pat Sanstha deposits against a database copy and documented sample figures.
6. **Dependency audit:** GitHub build logs reported npm dependency advisories including high/critical severity. Investigate affected packages and repair without automatically applying breaking updates.
7. **Windows installation:** Create an EXE from the exact verified release commit and launch it on the intended Windows PC. Verify the `re fin` artifacts before promoting.
8. **Web deployment:** Requires authorized Cloudflare credentials and production approval. User intends to deploy this manually after the complete validation checklist.

## Verification requirements

For a release candidate commit:
- `npm ci`
- `npm run lint`
- `npm run build`
- `npm test`
- `npx playwright test` in local-only isolated fixtures
- Windows installer and portable EXE build from the same approved commit
- On-device Windows startup and label/A4 printing tests
- Supabase staging and production authorization checks
- Data backup, restore, and import reconciliation
- Confirm approved Cloudflare deployment uses the same commit

## Future Windows handoff after approval

PowerShell in the existing checkout:

```powershell
Set-Location 'D:\vinay-traders\vinay-traders'
git status
git switch main
git pull --ff-only origin main
npm ci
npm run lint
npm run build
npm test
npm run desktop:build
Get-ChildItem '.\re fin\*.exe'
```

The `.exe` is unsigned, so Windows may display a publisher warning. Only use downloaded GitHub Actions artifacts from an exact verified commit. Save an independent backup before replacing an installation containing business records.

## Future manual Cloudflare release after approval

```powershell
Set-Location 'D:\vinay-traders\vinay-traders'
git switch main
git pull --ff-only origin main
npm ci
npm run build
npm test
npx wrangler deploy
```

Use the existing environment and protected secrets; never commit production credentials to this public repository. A successful Wrangler upload is not an authorization/financial acceptance test.

**No production deployment or database policy change is authorized by this source-level status document.**
