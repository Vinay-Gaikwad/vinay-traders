# Vinay Traders — Secure Cloud Cutover

## Current status

The checked-in 2026-09 SQL migrations permit anonymous access to the shop's \`vt_*\` tables. This is unsafe for customer, purchase, stock and salary records. **Do not deploy a new production release until the following checklist is completed.**

The auth UI and optimistic workspace revision checks are prepared, but **source changes do not repair the live database RLS**. Do not apply the restrictive SQL blind.

## Before changing production

1. Use Supabase to create a complete timestamped database backup (and verify it can be restored). Keep the backup outside the public repository.
2. Confirm the Supabase project is the actual one used by the Cloudflare web application. Check its public URL and publishable key environment settings.
3. In Supabase Auth, turn off public self-registration for this private shop application. Invite the actual owner using Supabase administration. Use no hardcoded credentials.
4. Apply \`supabase/migrations/20261113000100_prepare_workspace_authorization.sql\`. This only prepares the private membership table and access-check function.
5. As a Supabase SQL administrator, add the verified owner's auth UUID:
   \`\`\`sql
   insert into public.vt_workspace_members(user_id, role)
   values ('REPLACE_WITH_VERIFIED_AUTH_USER_UUID', 'Owner')
   on conflict (user_id) do update set role = excluded.role;
   \`\`\`
6. Run a test against a separate staging database to confirm the verified owner's account can sign in, retrieve records, and create a draft. Confirm an unrelated signed-in account cannot.
7. In a controlled maintenance window, execute \`docs/security/apply_after_owner_verified.sql\` manually through the Supabase SQL editor. It deliberately lives **outside** \`supabase/migrations\` so an ordinary CLI migration push cannot run it unexpectedly. This removes permissive \`vt_*\` policies, revokes anonymous table access, and enables member-only policies.
8. Verify: signed-out or anonymous requests cannot select \`vt_app_state\`, authenticated non-members cannot read it, the owner can read and save a draft without altering existing data.
9. Re-check data counts, purchase attachments, return history, worker payments and inventory values against the backup. Only then consider deploying the Cloudflare build.

## Cloudflare and local Windows behavior

- **Web:** \`VITE_SUPABASE_URL\` and \`VITE_SUPABASE_PUBLISHABLE_KEY\` must reference the correct project at build time. When configured, the application presents a sign-in screen; the server's RLS checks enforce access.
- **Windows:** the current \`desktop:build\` runs \`client:build\`; \`VITE_CLIENT_RELEASE=true\` deliberately disables Supabase. As a result, the Windows build is a **separate local workspace**, not a cloud-synced edition. Do not promise cross-device synchronization until an authenticated desktop flow is implemented and tested.
- **Backups:** an app stored only in localStorage is not a reliable permanent archive. Export verified data backups regularly; do not store business backups or customer data in this public GitHub repository.
- **Sync conflicts:** the optimistic revision guard prevents a stale browser from automatically overwriting newer cloud state. Local pending data remains on the browser when reconciliation is needed. A separate, explicit conflict-resolution workflow must be tested before enabling unattended multi-device operation.
- **Legacy normalized tables:** background delete-and-recreate projection is disabled unless \`VITE_ENABLE_NORMALIZED_PROJECTION=true\`. Never enable it in production without transactional tests.

## Rollback

If access is interrupted, use the verified owner/admin project session and restore the tested RLS migration or database backup with Supabase admin tools. Do not expose unrestricted \`anon\` policies as a permanent workaround.

## Release blockers

- Supabase Auth owner membership must be verified.
- Live RLS must be tested after manual cutover.
- Windows and web must not be advertised as synchronized while the desktop build remains \`client:build\`.
- The GitHub build/test workflow is not a production deployment. Cloudflare and Windows release are separate, authorized actions.
