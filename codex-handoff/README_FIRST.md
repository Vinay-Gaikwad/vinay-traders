# Vinay Traders — Codex Project Handoff

**Project:** Vinay Traders · Hardware & Plumbing Supplies · Windows Electron + React/TypeScript + Cloudflare Workers + Supabase + GitHub.  
**Repository:** `https://github.com/Vinay-Gaikwad/vinay-traders`  
**Working branch:** `main` (only branch).  
**Shop:** Shirala, Sangli, Maharashtra.  
**Production URL:** `https://vinay-traders.vinayvikasgaikwad.workers.dev/` (read-only context; not verified live in this handoff).  
**Absolute user requirement:** do not add GST/taxes. All customer documents are **Bills**, not GST invoices.  
**Asset source:** user-supplied design references and prior generated design samples, not real product catalog evidence.  

**Do not treat earlier passing builds as phase sign-off.** The repository has partially implemented modules; inspect and repair the real code instead of copying descriptions or hardcoding demo data.

## 1. Copy this folder into the project and open VS Code

In **Windows PowerShell** (VS Code Terminal > PowerShell), from the user’s existing project directory:

```powershell
Set-Location 'D:\vinay-traders\vinay-traders'
git status
git switch main
git fetch origin
git pull --ff-only origin main
code .
```

**If `git status` reports uncommitted work, stop before pulling.** Commit it or use `git stash push -u -m 'before-vinay-codex-refresh'` after confirming the changes are yours. Never run `git reset --hard`, `git clean -fd`, or a forced pull for this workflow. No new branch is required.

Then, download `Vinay_Traders_Codex_Handoff_Package.zip` and save it to your Windows Downloads folder, and run:

```powershell
Set-Location 'D:\vinay-traders\vinay-traders'
Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\Vinay_Traders_Codex_Handoff_Package.zip" -DestinationPath . -Force
Get-ChildItem '.\codex-handoff'
Get-Content '.\codex-handoff\MASTER_CODEX_PROMPT.md' | Set-Clipboard
```

Open Codex in VS Code and **paste the copied master prompt**. Codex should read the referenced PDFs and images from `codex-handoff/`. It must inspect the code first, not assume the PDFs are live exports.

To keep large visual references local only rather than committing them to a public GitHub repository:

```powershell
Add-Content '.git\info\exclude' 'codex-handoff/'
```

## 2. Validate your starting project

```powershell
node --version
npm --version
npm ci
npm run lint
npm run build
npm test
```

Optional browser tests after installing Playwright browsers:

```powershell
npx playwright install chromium
npx playwright test
```

For interactive inspection:

```powershell
npm run dev
```

Open the local URL shown by Vite. UI smoke tests MUST be isolated from the live shop database.

## 3. Use Codex with real checkpoints

**Preferred:** paste `MASTER_CODEX_PROMPT.md` once and let Codex execute the phases in order. If it stops midway, paste the relevant `PHASES/NN_...md` content with:

> Continue this phase. First read the module's code and attached visual/PDF references. Implement functioning code, tests, responsive screenshots, and true A4 exports. Do not just describe the plan. Run lint/build/tests; update the phase matrix only when tests pass. Preserve old business records and don't deploy production.

To inspect a phase visually, open `01_UI_DESIGN_REFERENCE_MANUAL.pdf` and its source image(s) at 100%. For document outputs open `02_A4_PDF_FORMAT_REFERENCE_MANUAL.pdf` and corresponding sample PDFs. These are design targets, not a product-catalog database.

## 4. Build final Windows EXE ONLY after all acceptance checks pass

```powershell
Set-Location 'D:\vinay-traders\vinay-traders'
npm ci
npm run lint
npm run build
npm test
npx playwright test
npm run desktop:build
Get-ChildItem '.\re fin\*.exe'
Get-ChildItem '.\re fin\*.exe' | Get-FileHash -Algorithm SHA256
```

The existing project's `electron-builder` outputs to **`D:\vinay-traders\vinay-traders\re fin`**. Confirm both installer and portable executable launch and print on the actual Windows PC. The normal desktop build is **local-only**; it does not automatically sync with the web app.

## 5. Cloudflare web deployment (manual, not during Codex implementation)

**Do NOT do this until the Supabase owner membership / member-only RLS cutover, staging backup/restore and financial acceptance checks are independently verified.** Otherwise the production database may be exposed or inaccessible.

```powershell
Set-Location 'D:\vinay-traders\vinay-traders'
git status
npm ci
npm run lint
npm run build
npm test
npx wrangler whoami
npx wrangler deploy
```

After deployment manually verify `https://vinay-traders.vinayvikasgaikwad.workers.dev/`, login permissions, correct revision, bill and stock records, and check rollback. Production credentials must remain in Cloudflare/Supabase secrets, **never** in this public GitHub repository.

## 6. Handoff files

- `MASTER_CODEX_PROMPT.md` — top-level instruction to paste once.
- `SECTION_BY_SECTION_CODEX_PROMPTS.md` — all 18 phases with acceptance requirements.
- `PHASES/` — focused prompts for each phase individually.
- `01_UI_DESIGN_REFERENCE_MANUAL.pdf` — design boards and UI layout direction.
- `02_A4_PDF_FORMAT_REFERENCE_MANUAL.pdf` — A4 purchase, supplier, plumber and other print document layouts.
- `VISUALS/` — full-resolution images included as actual files.
- `PRINT_SAMPLES/` — original official-logo A4 reference PDFs. **Not live exports.**
- `REFERENCE_MANIFEST.md` — asset-to-section mapping.

## 7. Important limitations

Some generated visual boards contain illustrative sample values. Only use the repository’s actual saved data for exports, and the user's future authoritative product-catalog PDFs for imports. Images are visual reference, not a direct pixel asset to place over the real UI. The live website could not be reliably inspected through the public lookup while assembling this pack; Codex should verify it only through permitted authenticated access before a release.
