# Dungeon & Database

Dungeon & Database is a Next.js + Supabase app for running scoped D&D-style campaigns with DM review built into character creation. Players build characters inside a specific campaign allowlist, and DMs review, request changes, and approve submissions from their own campaigns only.

## What It Does

- Supports two roles: `player` and `dm`
- Lets DMs create campaigns with a rule set, stat method, max level, and source allowlist
- Lets players create characters inside campaigns they belong to
- Tracks character progress through `draft`, `submitted`, `changes_requested`, and `approved`
- Runs a legality engine that reports errors and warnings without blocking submission
- Captures character snapshots during key save/submit/approve transitions
- Includes DM-only content administration for sources, species, classes, subclasses, spells, feats, and backgrounds

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS + local shadcn-style UI primitives
- Supabase Auth + Postgres + Row Level Security

## Domain Overview

### Users and campaigns

- `users` stores the app role and display name for each authenticated account
- `campaigns` belongs to a DM via `dm_id`
- `campaign_members` associates players to campaigns
- `campaign_source_allowlist` limits which content sources are usable in a campaign

### Character model

- `characters` stores the top-level sheet and review status
- `character_levels` stores class levels and subclass choices
- `character_skill_proficiencies` stores selected skills
- `character_choices` stores spells, feats, and other structured choices
- `character_snapshots` stores historical captures of a character sheet over time

### Content model

- Sources, species, classes, subclasses, backgrounds, spells, and feats live in first-class tables
- Content is filtered by campaign allowlist and campaign rule set before it reaches the sheet UI

## Character Review State Machine

```text
draft
  -> submitted
submitted
  -> changes_requested
  -> approved
changes_requested
  -> draft (after edits)
  -> submitted
approved
  -> draft (after edits)
```

Repo evidence:
- Save flow lives in `src/app/api/characters/[id]/route.ts`
- Submit flow lives in `src/app/api/characters/[id]/submit/route.ts`
- DM review flows live in `src/app/api/characters/[id]/approve/route.ts` and `src/app/api/characters/[id]/request-changes/route.ts`

## Security Model

- Supabase RLS is enabled across the public app tables used by the app
- DM access is scoped to campaigns they own, not “any DM”
- API routes add explicit ownership checks on top of RLS for defense in depth
- App routes use profile-based role checks and middleware redirects for missing profiles

The most recent RLS tightening is in:
- `supabase/migrations/016_scoped_dm_rls.sql`
- `supabase/migrations/017_enable_rls_missing.sql`

## Local Development

For the practical multi-machine setup workflow, see [SETUP.md](SETUP.md).

### Prerequisites

- Node.js and npm
- Vercel CLI
- Supabase CLI
- A Supabase project with the schema migrations applied

### First-time machine setup

On a fresh machine, relink the repo to the existing hosted services before running the app:

```bash
vercel login
supabase login
supabase link --project-ref cqpyvaynpzgyjerfesmz
cp .env.example .env.local
```

Then fill in the real Supabase keys in `.env.local`.

If you want one repeatable setup command after cloning, run:

```bash
nvm use
./setup
```

If you prefer `make`, the repo also supports:

```bash
make setup
make doctor
```

Vercel project metadata is already tracked in `.vercel/project.json`.
Supabase local project config is now tracked in `supabase/config.toml`.
Only the machine-specific Supabase link state in `supabase/.temp/` remains untracked.
Use `./setup` for first-time machine bootstrap and `npm run doctor` or `make doctor` to verify that the current machine is ready before editing or deploying.

### Environment variables

The repo directly references these variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Use `.env.example` as the starting point for `.env.local`.
`SUPABASE_SERVICE_ROLE_KEY` is required for the SRD seed script.

### Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seed content

The repo includes an SRD seed script:

```bash
npm run seed-srd
```

This script reads `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the environment.

## Migrations Workflow

Schema and RLS changes are tracked in `supabase/migrations/`.

Typical workflow:

1. Add a new migration file in `supabase/migrations/`
2. Ensure the repo is linked with `supabase link --project-ref cqpyvaynpzgyjerfesmz`
3. Apply it to the target Supabase project
4. Verify the app still typechecks locally

The repo now includes `supabase/config.toml` for local CLI defaults, but the remote project link is still machine-local and must be recreated with `supabase link` after cloning.

## Multi-Machine Notes

- Prefer one git checkout per machine rather than one shared live working tree with simultaneous edits.
- Do not rely on synced build artifacts. `node_modules`, `.next`, `output`, and `supabase/.temp` should stay machine-local.
- Run `npm run doctor` after switching machines or after another agent has changed setup-related files.

## Repo Map

- `src/app/` — pages and API routes
- `src/components/` — UI and DM/player workflows
- `src/lib/legality/` — legality input building and rules engine
- `src/lib/supabase/` — browser/server/admin Supabase clients
- `src/lib/snapshots.ts` — character snapshot capture
- `supabase/migrations/` — schema and policy history
- `scripts/seed-srd.ts` — SRD content seed script

## More Detail

Architecture notes live in [docs/architecture.md](docs/architecture.md).
