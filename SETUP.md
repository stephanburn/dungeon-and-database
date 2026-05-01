# Setup

This file is the practical setup guide for working on this repo across multiple machines.

## One-Time Per Machine

Install the required tools:

- Node.js 20.x
- npm
- Vercel CLI
- Supabase CLI
- Git
- GitHub CLI (`gh`)

Set the expected Node version:

```bash
nvm use
```

Authenticate the CLIs:

```bash
vercel login
supabase login
gh auth login
```

Recommended `gh auth login` choices:

- `GitHub.com`
- `HTTPS`
- `Y` to authenticate Git with GitHub credentials
- `Login with a web browser`

Bootstrap the repo:

```bash
./setup
```

That script will:

- install npm dependencies
- create `.env.local` from `.env.example` if needed
- check Vercel auth
- check Supabase auth
- relink Supabase to `cqpyvaynpzgyjerfesmz` when possible

After bootstrap, fill in the real values in `.env.local` if they are still placeholders.

## Daily Use

Start by making sure you are on the expected Node version:

```bash
nvm use
```

If this is a machine you have not used recently, or after another coding agent changed setup-related files, run:

```bash
make doctor
```

Then start the app:

```bash
npm run dev
```

## When To Run Which Command

- `./setup`: first run on a machine, or when local setup has drifted
- `make doctor`: quick readiness check after switching machines or after auth/env/tooling changes
- `npm run seed-srd`: seed SRD content using `.env.local`
- `npm run seed-demo`: seed deterministic player, DM, and admin QA data after SRD content exists

## Demo Authenticated QA

After normal bootstrap, fill `.env.local`, then run:

```bash
make doctor
npm run seed-srd
npm run seed-demo
npm run dev
```

`npm run seed-demo` uses the service-role key from `.env.local`. It creates or refreshes these deterministic demo accounts with the password `DemoPassw0rd!`:

- `demo-admin@dungeon-and-database.local`
- `demo-dm@dungeon-and-database.local`
- `demo-player@dungeon-and-database.local`

On a database that already has a singleton admin, the script leaves that admin untouched and prints a magic-link path for `/dm/content` instead of relying on a private browser session.

The demo fixture creates a DM-owned campaign with `PHB` and `ERftLW` allowed, a player membership, one draft character, one submitted character, and one changes-requested character. It also prints a rejected import fixture that can be pasted into `/dm/content` under Import diff to preview validation findings without applying writes.

Use these start points for authenticated QA:

- `/login`
- `/dm/dashboard`
- `/dm/content`
- `/characters/new`
- the character URLs printed by `npm run seed-demo`

## Repo-Specific Notes

- Vercel linkage is tracked in `.vercel/project.json`
- Supabase local config is tracked in `supabase/config.toml`
- Supabase machine-local link state lives in `supabase/.temp/`
- `.env.local` is machine-local and should not be committed

Current remote project references:

- Vercel project: `dungeon-and-database`
- Supabase project ref: `cqpyvaynpzgyjerfesmz`

## Multi-Machine Safety

- Prefer one checkout per machine instead of one simultaneously edited synced working tree
- Do not trust synced build output; keep `node_modules`, `.next`, `output`, and `supabase/.temp` machine-local
- Run `make doctor` before editing if anything feels off

## Git And GitHub

This machine should have:

- global Git identity configured
- `gh` authenticated
- Git push access working over HTTPS

Useful checks:

```bash
git status --short --branch
gh auth status
git remote -v
```
