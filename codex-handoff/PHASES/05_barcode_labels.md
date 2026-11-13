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
