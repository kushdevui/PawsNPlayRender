#!/usr/bin/env bash
# PawsNPlay - build the app's web version and publish it on this EC2 instance (Ubuntu or Amazon Linux 2023).
#
# Step 2 of 2. Run the server repo's scripts/deploy-ec2.sh first (Node 22, Nginx, HTTPS, swap, API).
# This script serves the Expo web build from /var/www/pawsnplay/app, where Nginx already routes:
#   /faqs, /know-your-dog, /waiver, /admin, /login, ...  -> this SPA (try_files ... /index.html)
#   /api/*                                      -> the Node API
#
#   First time:  git clone -b feat/admin-boarding https://github.com/kushdevui/PawsNPlayRender.git ~/PawsNPlayRender \
#                  && cd ~/PawsNPlayRender && bash scripts/deploy-web.sh
#   Later:       cd ~/PawsNPlayRender && bash scripts/deploy-web.sh
#
# What it does: fast-forwards the branch, installs packages (only when package.json changed), builds with the public API URL baked in
# (EXPO_PUBLIC_API_URL=$SITE_URL/api/v1, mocks off; no .env is written), swaps the new build in
# (the previous one is kept as app.prev), reloads Nginx and checks the pages answer. If the build
# fails, the live site is not touched. Safe to re-run any time.
#
# Optional env vars:
#   BRANCH=name     deploy another branch (checked out; default: the current branch, or feat/admin-boarding)
#   SITE_URL=...    public origin, e.g. https://pawsnplaywithme.com (default: SITE_URL in ~/.pawsnplay-deploy)
#   FORCE=1         deploy even with uncommitted local changes (they are built in, never discarded)
#   INSTALL=1       reinstall packages even if package.json has not changed
set -euo pipefail

DEFAULT_BRANCH="feat/admin-boarding"
DEFAULT_DOMAIN="pawsnplaywithme.com"
WWW_ROOT="/var/www/pawsnplay"
LIVE="$WWW_ROOT/app"
NEXT="$WWW_ROOT/app.new"
PREV="$WWW_ROOT/app.prev"
OUT_DIR="dist-web"
STATE_FILE="$HOME/.pawsnplay-deploy" # written by the server script (non-secret: DOMAIN, SITE_URL)

say() { printf '\n\033[1;35m==> %s\033[0m\n' "$*"; }
ok() { printf '\033[1;32m%s\033[0m\n' "$*"; }
warn() { printf '\n\033[1;33mWARNING: %s\033[0m\n' "$*" >&2; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }
state_get() { [ -f "$STATE_FILE" ] && grep -E "^$1=" "$STATE_FILE" | tail -n1 | cut -d= -f2- || true; }

[ "$(id -u)" -ne 0 ] || die "Run this as your normal user (ubuntu / ec2-user), not as root."

# ---------- 1. Repo root and prerequisites ----------
cd "$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
REPO_DIR="$(pwd)"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "$REPO_DIR is not a git checkout."
[ -f package.json ] || die "package.json not found in $REPO_DIR."

# One deploy at a time.
exec 9>"/tmp/pawsnplay-deploy-web.lock"
command -v flock >/dev/null && { flock -n 9 || die "Another deploy-web.sh is already running."; }

SERVER_HINT="Run the server setup first: bash <(curl -fsSL https://raw.githubusercontent.com/kushdevui/PawsNPlayServer/main/scripts/deploy-ec2.sh)"
NODE_MAJOR=$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/' || true)
[ "${NODE_MAJOR:-0}" -ge 22 ] 2>/dev/null || die "Node.js 22 is not installed (found: $(node -v 2>/dev/null || echo none)). $SERVER_HINT"
NGINX_BIN=$(command -v nginx || echo /usr/sbin/nginx)
[ -x "$NGINX_BIN" ] || die "Nginx is not installed. $SERVER_HINT"
[ -d "$WWW_ROOT" ] || die "$WWW_ROOT does not exist. $SERVER_HINT"
command -v sudo >/dev/null || die "sudo is required."
command -v curl >/dev/null || die "curl is required."
ok "Node $(node -v), $("$NGINX_BIN" -v 2>&1 | head -n1), repo $REPO_DIR"

# ---------- 2. Latest code ----------
CURRENT=$(git rev-parse --abbrev-ref HEAD)
if [ -n "${BRANCH:-}" ]; then
  TARGET="$BRANCH"
elif [ "$CURRENT" != "HEAD" ]; then
  TARGET="$CURRENT"
else
  TARGET="$DEFAULT_BRANCH" # detached HEAD
fi

CHANGES=$(git status --porcelain --untracked-files=no)
if [ -n "$CHANGES" ]; then
  if [ "${FORCE:-}" = "1" ]; then
    warn "Local changes (FORCE=1 - deploying with them included):"
    printf '%s\n' "$CHANGES" >&2
  else
    printf '%s\n' "$CHANGES" >&2
    die "There are uncommitted local changes (above). Commit or discard them (git checkout -- <file>), or re-run with FORCE=1."
  fi
fi

say "Fetching origin/$TARGET"
git fetch --prune origin
# Explicit refspec too, in case the clone was made with --single-branch.
git fetch origin "+refs/heads/${TARGET}:refs/remotes/origin/${TARGET}" \
  || die "Branch \"$TARGET\" was not found on origin."

if [ "$CURRENT" != "$TARGET" ]; then
  say "Switching to $TARGET"
  if git show-ref --verify --quiet "refs/heads/$TARGET"; then
    git checkout "$TARGET"
  else
    git checkout -b "$TARGET" --track "origin/$TARGET"
  fi
fi
git merge --ff-only "origin/$TARGET" \
  || die "Cannot fast-forward $TARGET to origin/$TARGET (local commits differ, or local changes conflict). Fix it by hand, e.g. git reset --hard origin/$TARGET."
COMMIT=$(git log -1 --format='%h %s')
ok "At $TARGET: $COMMIT"

# ---------- 3. Public site URL ----------
SITE_URL="${SITE_URL:-$(state_get SITE_URL)}"
if [ -z "$SITE_URL" ]; then
  TOKEN=$(curl -s -m 2 -X PUT "http://169.254.169.254/latest/api/token" \
    -H "X-aws-ec2-metadata-token-ttl-seconds: 60" || true)
  PUBLIC_IP=$(curl -s -m 2 -H "X-aws-ec2-metadata-token: ${TOKEN}" \
    "http://169.254.169.254/latest/meta-data/public-ipv4" || true)
  [[ "$PUBLIC_IP" =~ ^[0-9.]+$ ]] || PUBLIC_IP=$(curl -s -m 5 https://checkip.amazonaws.com | tr -d '[:space:]' || true)
  [[ "$PUBLIC_IP" =~ ^[0-9.]+$ ]] || die "Could not find this server's public IP. Re-run with SITE_URL=https://your-domain (or http://<ip>)."
  if getent ahostsv4 "$DEFAULT_DOMAIN" 2>/dev/null | awk '{print $1}' | sort -u | grep -qx "$PUBLIC_IP"; then
    SITE_URL="https://$DEFAULT_DOMAIN"
  else
    SITE_URL="http://$PUBLIC_IP"
  fi
  warn "No SITE_URL in $STATE_FILE - using $SITE_URL"
fi
SITE_URL="${SITE_URL%/}"
[[ "$SITE_URL" =~ ^https?://[^/]+$ ]] || die "SITE_URL must look like https://example.com or http://1.2.3.4 (got \"$SITE_URL\")."
SITE_HOST=$(printf '%s' "$SITE_URL" | sed -E 's#^https?://##; s#:.*$##')
API_URL="$SITE_URL/api/v1"
say "Site: $SITE_URL (API: $API_URL)"

# ---------- 4. Packages (skipped when nothing changed since the last install) ----------
NPM_FLAGS=(--no-audit --no-fund)
STAMP=node_modules/.pawsnplay-install-stamp
# Fingerprint of what decides the installed packages: package.json, plus package-lock.json only if it is
# committed (a lockfile generated on this machine changes on every install and must not trigger a reinstall).
deps_fingerprint() {
  {
    cat package.json
    git ls-files --error-unmatch package-lock.json >/dev/null 2>&1 && cat package-lock.json
    node -v
  } | sha256sum | cut -d' ' -f1
}
WANT_STAMP=$(deps_fingerprint)
if [ "${INSTALL:-0}" != "1" ] && [ -d node_modules ] && [ -f "$STAMP" ] && [ "$(cat "$STAMP")" = "$WANT_STAMP" ]; then
  say "Packages unchanged since the last deploy - skipping install (INSTALL=1 forces it)"
else
  if git ls-files --error-unmatch package-lock.json >/dev/null 2>&1; then
    say "Installing packages (npm ci)"
    npm ci "${NPM_FLAGS[@]}" || npm ci "${NPM_FLAGS[@]}" --legacy-peer-deps || die "npm ci failed (see above)."
  else
    # No committed lockfile: npm install updates node_modules in place (much faster than npm ci,
    # which deletes node_modules first).
    say "Installing packages (npm install)"
    if ! npm install "${NPM_FLAGS[@]}"; then
      warn "npm install failed - retrying with --legacy-peer-deps"
      npm install "${NPM_FLAGS[@]}" --legacy-peer-deps || die "npm install failed (see above)."
    fi
  fi
  printf '%s' "$WANT_STAMP" > "$STAMP"
fi

# ---------- 5. Build (the live site is untouched until this succeeds) ----------
say "Building the web app into $OUT_DIR (a few minutes on small instances)"
rm -rf "$OUT_DIR"
if ! CI=1 NODE_OPTIONS=--max-old-space-size=2048 \
  EXPO_PUBLIC_API_URL="$API_URL" EXPO_PUBLIC_USE_MOCKS=false \
  npx expo export -p web --output-dir "$OUT_DIR"; then
  die "The web build failed (see above). The live site was not changed."
fi
[ -s "$OUT_DIR/index.html" ] || die "The build finished but $OUT_DIR/index.html is missing. The live site was not changed."
ok "Build OK ($(du -sh "$OUT_DIR" | cut -f1))"

# ---------- 6. Publish: copy next to the live dir, then swap ----------
say "Publishing to $LIVE"
SUDO=""
[ -w "$WWW_ROOT" ] || SUDO="sudo"
$SUDO rm -rf "$NEXT"
$SUDO mkdir -p "$NEXT"
$SUDO chown "$(id -u):$(id -g)" "$NEXT"
if command -v rsync >/dev/null; then
  rsync -a --delete "$OUT_DIR/" "$NEXT/"
else
  cp -a "$OUT_DIR/." "$NEXT/"
fi
find "$NEXT" -type d -exec chmod 755 {} +
find "$NEXT" -type f -exec chmod 644 {} +
# Two renames (microseconds apart); the previous build stays in app.prev for a quick rollback.
$SUDO rm -rf "$PREV"
[ -e "$LIVE" ] && $SUDO mv "$LIVE" "$PREV"
$SUDO mv "$NEXT" "$LIVE"
if command -v selinuxenabled >/dev/null && selinuxenabled 2>/dev/null && command -v restorecon >/dev/null; then
  sudo restorecon -R "$LIVE" || true
fi
sudo nginx -t
sudo systemctl reload nginx
ok "Published $COMMIT"

# ---------- 7. Smoke check (through local Nginx, with this site's host name) ----------
say "Checking the site"
if [[ "$SITE_URL" == https://* ]]; then
  BASE="https://$SITE_HOST"
  CURL_ARGS=(--resolve "$SITE_HOST:443:127.0.0.1")
else
  BASE="http://127.0.0.1"
  CURL_ARGS=(-H "Host: $SITE_HOST")
fi
FAILED=""
for path in /faqs /know-your-dog /waiver /admin /api/v1/health; do
  CODE=$(curl -s -m 10 -o /dev/null -w '%{http_code}' "${CURL_ARGS[@]}" "$BASE$path" 2>/dev/null || true)
  CODE="${CODE:-000}"
  if [ "$CODE" = 200 ]; then
    printf '  %-16s \033[1;32m%s\033[0m\n' "$path" "$CODE"
  elif [ "$path" = /api/v1/health ] && [ "$CODE" = 503 ]; then
    printf '  %-16s \033[1;33m%s (API up, database not connected)\033[0m\n' "$path" "$CODE"
  else
    printf '  %-16s \033[1;31m%s\033[0m\n' "$path" "$CODE"
    [ "$path" = /api/v1/health ] || FAILED=1
  fi
done

cat <<EOF

Live now ($COMMIT):
  FAQs:           $SITE_URL/faqs
  Know Your Dog:  $SITE_URL/know-your-dog
  Waiver:         $SITE_URL/waiver
  Team app:       $SITE_URL/admin
Update later:     cd $REPO_DIR && bash scripts/deploy-web.sh
Roll back:        sudo mv $LIVE $LIVE.bad && sudo mv $PREV $LIVE && sudo rm -rf $LIVE.bad
EOF

if [ -n "$FAILED" ]; then
  die "Some pages did not answer 200 (above). Check: sudo tail -n 50 /var/log/nginx/error.log"
fi
