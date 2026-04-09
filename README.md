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

### Prerequisites

- Node.js and npm
- A Supabase project with the schema migrations applied

### Environment variables

The repo directly references these variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

`SUPABASE_SERVICE_ROLE_KEY` is required for the SRD seed script. A checked-in `.env.example` file was not found in the repo.

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
2. Apply it to the target Supabase project
3. Verify the app still typechecks locally

An automated migration runner config file was not found in the repo, so migration application details depend on your Supabase setup.

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
