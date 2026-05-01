#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_REF="cqpyvaynpzgyjerfesmz"
EXPECTED_NODE_MAJOR=""
FAILURES=0
WARNINGS=0

cd "$ROOT_DIR"

record_failure() {
  echo "FAIL: $1"
  FAILURES=$((FAILURES + 1))
}

record_ok() {
  echo "OK: $1"
}

record_warning() {
  echo "WARN: $1"
  WARNINGS=$((WARNINGS + 1))
}

env_value_for() {
  local key="$1"
  grep -E "^${key}=" .env.local | tail -n 1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'
}

warn_placeholder_env() {
  local key="$1"
  local value
  value="$(env_value_for "$key")"

  if [[ "$value" == "https://your-project-ref.supabase.co" ||
        "$value" == "replace-with-your-supabase-anon-key" ||
        "$value" == "replace-with-your-supabase-service-role-key" ||
        "$value" == *"your-project-ref"* ||
        "$value" == *"replace-with-"* ||
        "$value" == *"paste-your-"* ]]; then
    record_warning "$key still uses a placeholder value in .env.local"
  fi
}

if [[ -f .nvmrc ]]; then
  EXPECTED_NODE_MAJOR="$(tr -d '[:space:]' < .nvmrc)"
fi

for cmd in node npm vercel supabase; do
  if command -v "$cmd" >/dev/null 2>&1; then
    record_ok "$cmd is installed"
  else
    record_failure "$cmd is not installed"
  fi
done

if command -v node >/dev/null 2>&1 && [[ -n "$EXPECTED_NODE_MAJOR" ]]; then
  CURRENT_NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
  if [[ "$CURRENT_NODE_MAJOR" == "$EXPECTED_NODE_MAJOR" ]]; then
    record_ok "Node major version matches .nvmrc ($EXPECTED_NODE_MAJOR.x)"
  else
    record_failure "Node major version is $CURRENT_NODE_MAJOR.x, expected $EXPECTED_NODE_MAJOR.x"
  fi
fi

if [[ -f .vercel/project.json ]]; then
  record_ok ".vercel/project.json exists"
else
  record_failure ".vercel/project.json is missing"
fi

if [[ -f supabase/config.toml ]]; then
  record_ok "supabase/config.toml exists"
else
  record_failure "supabase/config.toml is missing"
fi

if [[ -f .env.local ]]; then
  record_ok ".env.local exists"
  for key in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY; do
    if grep -Eq "^${key}=" .env.local; then
      record_ok "$key is set in .env.local"
      warn_placeholder_env "$key"
    else
      record_failure "$key is missing from .env.local"
    fi
  done
else
  record_failure ".env.local is missing"
fi

if [[ -f scripts/seed-demo.ts ]]; then
  record_ok "scripts/seed-demo.ts exists"
else
  record_failure "scripts/seed-demo.ts is missing"
fi

if node -e "const scripts=require('./package.json').scripts||{}; process.exit(scripts['seed-srd']&&scripts['seed-demo']?0:1)" >/dev/null 2>&1; then
  record_ok "Demo seed scripts are wired; run npm run seed-srd, then npm run seed-demo"
else
  record_failure "Demo seed scripts are missing; expected npm run seed-srd and npm run seed-demo"
fi

if vercel whoami >/dev/null 2>&1; then
  record_ok "Vercel CLI is authenticated"
else
  record_failure "Vercel CLI is not authenticated"
fi

if supabase projects list >/dev/null 2>&1; then
  record_ok "Supabase CLI is authenticated"
else
  record_failure "Supabase CLI is not authenticated"
fi

if [[ -f supabase/.temp/project-ref ]]; then
  CURRENT_PROJECT_REF="$(tr -d '[:space:]' < supabase/.temp/project-ref)"
  if [[ "$CURRENT_PROJECT_REF" == "$PROJECT_REF" ]]; then
    record_ok "Supabase project ref matches $PROJECT_REF"
  else
    record_failure "Supabase project ref is $CURRENT_PROJECT_REF, expected $PROJECT_REF"
  fi
else
  record_failure "supabase/.temp/project-ref is missing; run supabase link --project-ref $PROJECT_REF"
fi

if [[ "$FAILURES" -gt 0 ]]; then
  echo
  echo "Doctor found $FAILURES issue(s)."
  exit 1
fi

echo
if [[ "$WARNINGS" -gt 0 ]]; then
  echo "Doctor found $WARNINGS warning(s)."
fi
echo "Doctor check passed."
