# Vinay Traders — Codex Project Handoff

**Project:** Vinay Traders · Hardware & Plumbing Supplies · Windows Electron + React/TypeScript + Cloudflare Workers + Supabase + GitHub.  
**Repository:** `https://github.com/Vinay-Gaikwad/vinay-traders`  
**Working branch:** `main` (only branch).  
**Shop:** Shirala, Sangli, Maharashtra.  
**Production URL:** `https://vinay-traders.vinayvikasgaikwad.workers.dev/` (read-only context; not verified live in this handoff).  
**Absolute user requirement:** do not add GST/taxes. All customer documents are **Bills**, not GST invoices.  
**Asset source:** user-supplied design references and prior generated design samples, not real product catalog evidence.  

**Do not treat earlier passing builds as phase sign-off.** The repository has partially implemented modules; inspect and repair the real code instead of copying descriptions or hardcoding demo data.

# Asset-to-module index

**Source:** previously created Vinay Traders visual references and PDF designs. These are not verified current production exports. Exact screenshots and authentic supplier catalogs are still required for real inventory import.

## Included visual image files

- **Foundations / dashboard / navigation** — `VISUALS/a_large_clean_modern_ui_design_system_dashboard.png`: Global design system, sidebar, cards, typography and responsive widgets.
- **Foundations / dashboard / navigation** — `VISUALS/vinay_traders_ui_glitch_fix_reference.png`: Visual fixes for clipping, nav, tables, forms and cards.
- **Foundations / dashboard / navigation** — `VISUALS/a_polished_modern_desktop_web_app_dashboard_ui_for.png`: Dashboard layout, reports and cross-module overview.
- **Purchase** — `VISUALS/vinay_traders_purchase_module_redesign_board.png`: Purchase register, editor, detailed panel and KPIs.
- **Purchase** — `VISUALS/vinay_traders_pos_redesign_showcase.png`: Alternative purchase/billing workflow visual.
- **Inventory** — `VISUALS/a_detailed_comprehensive_ui_ux_redesign_specifica.png`: Shared inventory/operations board, design-system direction.
- **Inventory** — `VISUALS/a_large_detailed_infographic_ux_redesign_specific.png`: Full multi-module UI guidance; not a supplier price list.
- **Quotation** — `VISUALS/vinay_traders_quotation_ui_board.png`: Quotation creation and history UI.
- **Barcode** — `VISUALS/vinay_traders_barcode_labels_ui_board.png`: Label builder, preview and printing UI.
- **Billing** — `VISUALS/vinay_traders_bill_pos_redesign_board.png`: Billing/point-of-sale UI and receipts.
- **Bills and History** — `VISUALS/vinay_traders_bills_history_redesign.png`: History table, date/customer filters, recent bill panels.
- **Customers** — `VISUALS/vinay_traders_customer_module_redesign.png`: Customer dashboard, account and customer editor.
- **Customers** — `VISUALS/vinay_traders_customer_account_report.png`: Customer A4 statement concept image.
- **Suppliers** — `VISUALS/a_detailed_polished_ui_ux_redesign_collage_of_the.png`: Supplier module directory, forms and account.
- **Suppliers** — `VISUALS/a_clean_modern_saas_dashboard_ui_for_suppliers_i.png`: Supplier directory standalone screenshot concept.
- **Plumbers** — `VISUALS/Plumber_Module_Main_Design_Board.png`: Plumber directory/account and commission tabs.
- **Plumbers** — `VISUALS/Plumber_Module_Forms_Design_Board.png`: Add/Edit plumber form and payout modal.
- **Workers** — `VISUALS/vinay_traders_worker_profile_redesign.png`: Worker account, tabs, attendance and payments.
- **Workers** — `VISUALS/vinay_traders_payroll_redesign_board.png`: Payroll register and history UI.
- **Workers** — `VISUALS/vinay_traders_reports_payslip_redesign.png`: A4 payslip and payroll document concepts.
- **Attendance** — `VISUALS/a_detailed_high_fidelity_ui_redesign_mockup_for_t.png`: Daily and monthly attendance matrix UI.
- **Pat Sanstha** — `VISUALS/a_polished_modern_saas_dashboard_redesign_and_ui.png`: Daily deposit plan management and modal.
- **Pat Sanstha** — `VISUALS/a_polished_detailed_dashboard_ui_mockup_for.png`: Alternate ledger dashboard with period comparisons.
- **Dashboard / Reports** — `VISUALS/a_large_clean_modern_ui_design_system_dashboard.png`: Dashboards and shared report controls.
- **PDF Branding** — `VISUALS/vinay_traders_pdf_design_showcase.png`: All purchase PDF examples in one visual board.

## Included individual PDF samples

- **Purchase Invoice A4 Portrait** — `PRINT_SAMPLES/Purchase_Invoice_A4_Portrait_Official_Logo.pdf`: Real company logo and sample invoice lines; reference only.
- **Purchase Register A4 Landscape** — `PRINT_SAMPLES/Purchase_Register_A4_Landscape_Official_Logo.pdf`: 10-column register and summary; reference only.
- **Product/Purchase Report A4 Landscape** — `PRINT_SAMPLES/Product_Purchase_Report_A4_Landscape_Official_Logo.pdf`: Per-product rows and totals; reference only.
- **Supplier Directory A4 Landscape** — `PRINT_SAMPLES/Vinay_Traders_Supplier_Directory_A4_Colour.pdf`: Supplier list.
- **Supplier Purchase History A4 Portrait** — `PRINT_SAMPLES/Vinay_Traders_Supplier_Purchase_History_A4_Colour.pdf`: Supplier purchases.
- **Supplier Account Statement A4 Portrait** — `PRINT_SAMPLES/Vinay_Traders_Supplier_Account_Statement_A4_Colour.pdf`: Statement.
- **Plumber Directory A4** — `PRINT_SAMPLES/01_Plumber_Directory_A4_Color.pdf`: Plumber directory.
- **Referred Customers A4** — `PRINT_SAMPLES/02_Referred_Customers_A4_Color.pdf`: Referral customer list.
- **Referred Bills A4** — `PRINT_SAMPLES/03_Referred_Bills_A4_Color.pdf`: Referral bills.
- **Commission Ledger A4** — `PRINT_SAMPLES/04_Commission_Ledger_A4_Color.pdf`: Commissions and reversal history.
- **Plumber Payments A4** — `PRINT_SAMPLES/05_Payment_History_A4_Color.pdf`: Payment ledger.
- **Plumber Profile A4** — `PRINT_SAMPLES/06_Plumber_Profile_A4_Color.pdf`: Partner profile.

## Important assumptions, clarification hierarchy

- The logo inside the actual sample PDFs is the brand logo; do not use placeholder/incorrect image examples as production output.
- The A4 portrait/landscape requirements in the user's written specification supersede any incidental page dimensions in old legacy exports.
- Some boards visually show hypothetical amounts, UI mock data and mock numbers. Never hardcode these into the real software.
- Uploaded supplier invoices are real attachments to saved purchases, while shop-generated Purchase Invoice is a separate A4 report.
- Do not conflate worker contractual base salary (stays recorded) and current remaining payable balance (becomes zero after payment).
- The product catalog source PDFs were NOT confirmed available during pack creation. Do not import dummy products to satisfy a completion metric.
- Supabase production RLS security cutover, database backup and actual Windows cloud sync remain critical independent release gates.

## Additional included portrait document mockups

- `VISUALS/vinay_traders_retail_bill.png` — Customer bill design reference.
- `VISUALS/vinay_traders_plumbing_invoice.png` — Alternative customer bill layout.
- `VISUALS/premium_corporate_quotation_for_vinay_traders.png` — Corporate quotation portrait concept.
- `VISUALS/a_clean_polished_a4_portrait_attendance_report.png` — Attendance report portrait.
- `VISUALS/a_clean_professional_a4_style_printable_report_sh.png` — Pat Sanstha report portrait.
- `VISUALS/a_clean_modern_professional_quotation_document.png` — Quotation paper alternate.
