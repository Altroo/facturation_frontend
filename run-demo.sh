#!/usr/bin/env bash
set -euo pipefail

import_env_file() {
  local path="$1"
  shift
  while IFS= read -r raw_line || [[ -n "$raw_line" ]]; do
    local line="$(printf '%s' "$raw_line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    if [[ -z "$line" || "$line" == \#* || "$line" != *=* ]]; then
      continue
    fi

    local name="${line%%=*}"
    local value="${line#*=}"
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"

    while (($#)); do
      local from="$1"
      local to="$2"
      value="${value//${from}/${to}}"
      shift 2
    done

    export "$name=$value"
  done < "$path"
}

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
site_base='http://localhost:3000'
api_base='http://localhost:8000'

source_env=''
for candidate in "$repo_root/.env.production" "$repo_root/.env.local" "$repo_root/.env.example"; do
  if [[ -f "$candidate" ]]; then
    source_env="$candidate"
    break
  fi
done

if [[ -n "$source_env" ]]; then
  import_env_file "$source_env" \
    'wss://facturation-api.elbouazzatiholding.ma/ws' 'ws://localhost:8000/ws' \
    'https://facturation-api.elbouazzatiholding.ma/api' 'http://localhost:8000/api' \
    'https://facturation-api.elbouazzatiholding.ma' 'http://localhost:8000' \
    'https://facturation.elbouazzatiholding.ma' 'http://localhost:3000'
fi

export NODE_ENV=development
export ALLOWED_ORIGINS="$site_base"
export NEXT_PUBLIC_BACKEND_DOMAIN='localhost:3000'
export NEXT_PUBLIC_BACKEND_API="$api_base/api"
export NEXT_PUBLIC_API_ROOT_URL='localhost'
export NEXT_PUBLIC_API_ROOT_PORT='8000'
export NEXT_PUBLIC_API_URL="$api_base"
export NEXT_PUBLIC_ROOT_API_URL="$api_base/api"
export NEXT_PUBLIC_ROOT_WS_URL='ws://localhost:8000/ws'
export NEXT_PUBLIC_DOMAIN_URL_PREFIX="$site_base"
export NEXT_PUBLIC_HTTP_PROTOCOLE='http'
export NEXTAUTH_URL="$site_base"
export NEXTAUTH_URL_INTERNAL="$site_base/api/auth"
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-facturation-demo-nextauth-secret}"

cd "$repo_root"
bun run dev