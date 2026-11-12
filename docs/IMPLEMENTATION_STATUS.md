# Vinay Traders — Implementation & Release Status

Checked against the GitHub \`main\` branch on **13 November 2026**. This is a status report, not a production sign-off. Source presence and passing unit tests do not replace testing each workflow in Windows, web and Supabase.

## Implemented or improved in this development cycle

- [x] Phase 00: GitHub source review; consolidated \`development\` into \`main\`, removed old branches.
- [x] Phase 01 (partial): Consistent shared theme tokens, typography, navigation styles, focus states, accessible sort controls, dark/system appearance, number-wheel protection.
- [x] Phase 01 (partial): Cloud sign-in gate and sign-out, safe revision-checked cloud data writes and conflict warning.
- [ ] Phase 01 security cutover: **Blocked until owner account, backup and manual RLS cutover have been verified**. Old permissive \`vt_*\` policies may still be active on production.
- [x] Phase 02 (source): Supplier invoice PDF/image validation and preview in purchase editor/detail, purchase register, supplier lookup.
- [x] Phase 03 (source): Product supplier/category linkage, price/discount margin and supplier filtering.
- [x] Phase 04: A4 vector quotation PDF generator (replaces screenshot slicing); date search is in the quotation register.
- [ ] Phase 04: Screenshot-by-screenshot A4 PDF print-preview verification, including unusually long quotation tables.
- [ ] Phase 05: Barcode printer compatibility and device testing not verified.
- [ ] Phase 06: Complete billing UI visual parity and A4 customer-bill QA not signed off.
- [x] Phase 07 (source): Customer and date filters in Bills & History.
- [ ] Phase 08: Customer directory/profile print and UX acceptance tests remain.
- [x] Phase 09 (source): Supplier name/mobile search and account reports.
- [x] Phase 10 (source): Plumber referrals, commission, payment tracking.
- [x] Phase 11 (source): A4 worker salary slips, historical payslip export, scheduled bonus periods, remaining salary zero after settlement while preserving salary history.
- [x] Phase 12 (source): Daily and monthly attendance views; payroll links.
- [x] Phase 13 (source): Multiple Pat Sanstha plans with different daily amounts.
- [x] Phase 14 (source): Stock-restoring returns, original/revised bill PDF comparison, commission adjustment, refund audit and partial refund settlement.
- [x] Phase 15 (source): Separate personal/shop expense records and three report exports.
- [x] Phase 16 (source): Main dashboard daily/weekly/monthly/yearly report export, current refund liabilities, non-hardcoded sales trend, stock/bill summary.
- [x] Phase 16: Legacy standalone Reports route removed; dashboard report exports remain.
- [x] Phase 17 (partial): Build, lint and accounting regression tests in GitHub Actions; Windows EXE build workflow outputs to \`re fin\`.
- [ ] Phase 17: Latest source-specific Windows EXE artifact, Windows installation smoke test, production Supabase RLS verification and Cloudflare deployment are still release gates.

## QA evidence

- \`.github/workflows/validate.yml\` — runs \`npm ci\`, \`npm run build\`, \`npm run test\` and \`npm run lint\`.
- \`src/services/operations.test.ts\` — purchase attachments and stock, duplicate return prevention and refund arithmetic, worker payment balance accounting.
- \`.github/workflows/windows-release.yml\` — generates installer and portable unsigned Windows executables.
- \`.github/workflows/deploy-cloudflare.yml\` — manual, approval-gated; no automatic production deploy.

## Design references

The user has supplied visual references and two combined A4 guides:
- \`01_UI_Redesign_Exact_Visual_References.pdf\` — 21 pages.
- \`02_All_A4_PDF_Format_References.pdf\` — 15 pages.

These files live in the ChatGPT artifact package, **not inside the GitHub repository**. Design acceptance should compare at least 1366×768 desktop, 1024 tablet, and 375 mobile viewports, in light and dark modes.

## Known blockers

1. **Security:** Production Supabase RLS still needs the verified manual authorization cutover in \`docs/security/README.md\`. Web deployment must wait.
2. **Data integrity:** Optimistic-lock conflict handling prevents silent overwrites but a user-facing merge/reconciliation flow is still needed for truly multi-user sync.
3. **Cross-device Windows:** The default desktop build is a local offline workspace. A separate authenticated cloud-desktop mode exists, but must not be released without Supabase owner/RLS and desktop authentication tests.
4. **Inventory catalog:** All product PDFs requested by the user must be supplied in machine-readable or visually reviewable form and imported with source-by-source reconciliation. No missing products should be guessed or fabricated.
5. **UI exactness:** Code compilation does not establish exact visual match or functional UI test coverage.
6. **PDF printing:** Real multi-page A4 output with long product names, rows, and Marathi Unicode text requires live visual test passes.
7. **Local file destination:** GitHub Actions cannot write directly into the user's \`D:\vinay-traders\vinay-traders\re fin\` directory. Download the build artifact and extract/install it on the Windows machine.

## Definition of final production release

- Authenticated owner and role-based access tested with RLS enabled.
- Verified backup/restore of all historical shop records.
- Inventory, supplier attachment, billing, returns, commissions, payroll, expenses reconciled against known sample fixtures and real data under supervision.
- All A4 PDFs checked page-by-page and printer tested.
- Web QA on user-specified Cloudflare address and Windows QA on actual install.
- GitHub Actions success for the **exact** source commit used to build/deploy.
- Browser and Windows release commit SHA documented, with recoverable rollback.
