#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_REF="cqpyvaynpzgyjerfesmz"

cd "$ROOT_DIR"

echo "==> Bootstrapping dungeon-and-database"

if [[ -f .nvmrc ]]; then
  expected_node_major="$(tr -d '[:space:]' < .nvmrc)"
  current_node_major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo "missing")"
  if [[ "$current_node_major" != "$expected_node_major" ]]; then
    echo "Warning: expected Node $expected_node_major.x from .nvmrc, found ${current_node_major}."
  fi
fi

for cmd in npm vercel supabase; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd"
    exit 1
  fi
done

if [[ ! -f .env.local && -f .env.example ]]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example. Fill in the real Supabase keys."
fi

echo "==> Installing npm dependencies"
npm install

if vercel whoami >/dev/null 2>&1; then
  echo "Vercel CLI is authenticated."
else
  echo "Vercel CLI is not authenticated yet. Run: vercel login"
fi

if supabase projects list >/dev/null 2>&1; then
  linked_ref=""
  if [[ -f supabase/.temp/project-ref ]]; then
    linked_ref="$(tr -d '[:space:]' < supabase/.temp/project-ref)"
  fi

  if [[ "$linked_ref" != "$PROJECT_REF" ]]; then
    echo "==> Linking Supabase project $PROJECT_REF"
    supabase link --project-ref "$PROJECT_REF"
  else
    echo "Supabase project is already linked to $PROJECT_REF."
  fi
else
  echo "Supabase CLI is not authenticated yet. Run: supabase login"
fi

echo "==> Bootstrap finished"
echo "Run 'npm run doctor' for a portability check."
