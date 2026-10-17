# Agent Instructions

## Supabase Data API Grants

Any migration that creates or exposes an object in the public schema for Supabase's Data API must include an explicit GRANT statement in the same migration. Do not rely on Supabase project default privileges.

For new `public` tables, add the minimum required table privileges for the roles that need API access, usually `authenticated` and `service_role`, alongside the RLS setup. Add `anon` only when unauthenticated access is intentionally required.

For new `public` views used through `supabase.from(...)`, grant `SELECT` explicitly. For new public RPC functions used through `supabase.rpc(...)`, grant `EXECUTE` explicitly. If a table uses sequences or identity columns, include the matching sequence privileges as well.

## Verify

Run before and after changes; all must pass on `main`:

```bash
./node_modules/.bin/tsc --noEmit
npm run lint
npm test
```

- `npm run lint` runs `next lint` over `src`, `test` and `scripts` (plain `next lint` skips `test/` and `scripts/`). Unused vars and args prefixed with `_` are allowed.
- `npm run verify` runs tsc and the tests together. Use the project-local `tsc`; run `npm ci` first if `node_modules` is missing.
