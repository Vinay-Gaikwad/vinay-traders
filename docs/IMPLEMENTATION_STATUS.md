# Vinay Traders — Implementation & Release Status

Checked against the local \`main\` checkout at \`e6837e7\` on **13 November 2026**. This is a status report, not a production sign-off. Source presence and passing unit tests do not replace testing each workflow in Windows, web and Supabase. See \`docs/CODEX_PROGRESS.md\` and \`docs/CODEX_IMPLEMENTATION_MATRIX.md\` for the current audited baseline and phase gates.

## Latest local verification checkpoint

The current working tree contains additional, uncommitted purchase, inventory, attendance and payroll fixes based on `e6837e7`. `npm run lint`, the Vite production build, `npm test` (9 tests), and the complete Playwright suite (28 desktop/mobile Chromium tests) pass. Purchase PDF fixtures were generated as A4 documents with 1, 20 and 100 row pagination cases; product report amounts and totals were checked across all 71 pages. See preview PNGs in `output/pdf/previews/verification-2026-11-13-updated/` and fixture PDFs in `output/pdf/verification-2026-11-13/`.

This checkpoint is not a Windows installer test or production release. Marathi font fidelity, real printer output, comparison against saved owner records, and remaining phase acceptance checks are outstanding.

## Implemented or improved in this development cycle

- [ ] Phase 00: Repository, references and local checks reviewed; database backup/restore and 4-viewport baseline evidence still outstanding.
- [x] Phase 01 (partial): Consistent shared theme tokens, typography, navigation styles, focus states, accessible sort controls, dark/system appearance, number-wheel protection.
- [x] Phase 01 (partial): Cloud sign-in gate and sign-out, safe revision-checked cloud data writes and conflict warning.
- [ ] Phase 01 security cutover: **Blocked until owner account, backup and manual RLS cutover have been verified**. Old permissive \`vt_*\` policies may still be active on production.
- [x] Phase 02 (source): Supplier invoice PDF/image validation and preview in purchase editor/detail, purchase register, supplier lookup.
- [x] Phase 03 (source): Product supplier/category linkage, price/discount margin and supplier filtering. The four user-supplied 2021 PDFs have now been found and their 1,528 source-attributed, zero-stock catalogue rows are in \`src/assets/price-list-catalog.json\`; source reconciliation and current-price confirmation are outstanding.
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

The reviewed design references, 26-page UI manual, A4 PDF manual, visual board and print samples are in \`codex-handoff/\`. All reference pages and image files were visually reviewed for this cycle. Design acceptance should compare at least 1366×768 desktop, 1024 tablet, 375 mobile and 320 mobile viewports, in light and dark modes.

## Known blockers

1. **Security:** Production Supabase RLS still needs the verified manual authorization cutover in \`docs/security/README.md\`. Web deployment must wait.
2. **Data integrity:** Optimistic-lock conflict handling prevents silent overwrites but a user-facing merge/reconciliation flow is still needed for truly multi-user sync.
3. **Cross-device Windows:** The default desktop build is a local offline workspace. A separate authenticated cloud-desktop mode exists, but must not be released without Supabase owner/RLS and desktop authentication tests.
4. **Inventory catalog:** The four 2021 price lists were located in the user's Downloads folder and imported with source references, historical pricing and zero stock. Reconcile extracted rows against each original page and obtain current price/stock confirmation before live purchasing. Do not invent or infer missing records.
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
