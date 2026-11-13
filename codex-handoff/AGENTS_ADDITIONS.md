# Vinay Traders — Codex Project Handoff

**Project:** Vinay Traders · Hardware & Plumbing Supplies · Windows Electron + React/TypeScript + Cloudflare Workers + Supabase + GitHub.  
**Repository:** `https://github.com/Vinay-Gaikwad/vinay-traders`  
**Working branch:** `main` (only branch).  
**Shop:** Shirala, Sangli, Maharashtra.  
**Production URL:** `https://vinay-traders.vinayvikasgaikwad.workers.dev/` (read-only context; not verified live in this handoff).  
**Absolute user requirement:** do not add GST/taxes. All customer documents are **Bills**, not GST invoices.  
**Asset source:** user-supplied design references and prior generated design samples, not real product catalog evidence.  

**Do not treat earlier passing builds as phase sign-off.** The repository has partially implemented modules; inspect and repair the real code instead of copying descriptions or hardcoding demo data.
## Suggested persistent Codex instructions (append to any existing AGENTS.md, do not overwrite it)

Follow the project's `codex-handoff/MASTER_CODEX_PROMPT.md` and `codex-handoff/SECTION_BY_SECTION_CODEX_PROMPTS.md` exactly. Implement, test, inspect screenshots/PDF exports and commit in small verified steps. Never wipe shop data, disable security, ship unfinished UI, invent missing product-catalog entries, or auto-deploy production. All customer bills are tax-free Bills. App references under `VISUALS/` are design targets, not production data. Do not mark phase PASS without screenshots and tests. Preserve `main` and existing working functionality. Windows EXEs to `re fin` only after the final release gate.
