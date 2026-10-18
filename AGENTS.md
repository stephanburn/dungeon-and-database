# Agent Instructions

## Supabase Data API Grants

Any migration that creates or exposes an object in the public schema for Supabase's Data API must include an explicit GRANT statement in the same migration. Do not rely on Supabase project default privileges.

For new `public` tables, add the minimum required table privileges for the roles that need API access, usually `authenticated` and `service_role`, alongside the RLS setup. Add `anon` only when unauthenticated access is intentionally required.

For new `public` views used through `supabase.from(...)`, grant `SELECT` explicitly. For new public RPC functions used through `supabase.rpc(...)`, grant `EXECUTE` explicitly. If a table uses sequences or identity columns, include the matching sequence privileges as well.

## Session sync (local and cloud)
Work on this repo happens both on Stephan's laptop and in Claude Code cloud sessions, and each side only sees what is pushed to GitHub. Cloud sessions start from the default branch, so unmerged PR branches and unpushed local commits are invisible to them.
- **At the start of a session:** run `git fetch`, then check whether the current branch is behind or ahead of its remote, whether the working tree has uncommitted changes, and whether there are open PRs (`gh pr list`) from other sessions. Report anything out of line before changing code. (Local sessions get this from a SessionStart hook; cloud sessions must do it themselves.)
- **Before ending a session:** commit and push the work, or open a PR, so the other side can see it. If anything is left uncommitted or unpushed, say so.
