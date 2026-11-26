# PawsNPlay 🐾

React Native app (Expo SDK 58, Expo Router, TypeScript, React Native Paper) for the **Paws N' Play dog boarding** team.
Phase 1 is the **admin board**: dogs, bookings (check-in/out), capacity dashboard.
Requirements & architecture: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.
Runs on Android and iOS. The Node.js REST backend lives in a separate repo; until it is ready the
app can run on mock JSON (`mock/`, opt-in with `EXPO_PUBLIC_USE_MOCKS=true`).

## Getting started
Requires Node 22.13+ or 24.3+ (odd versions are not supported). With nvm: `nvm install && nvm use` (reads `.nvmrc`).

```bash
npm install                # use Node 22 (nvm use)
npx expo install --fix     # pins every Expo package to the SDK 58-compatible version
cp .env.example .env       # real API on :4000 by default; set EXPO_PUBLIC_USE_MOCKS=true for mock data
npx expo start             # press a = Android, i = iOS simulator, or scan the QR code
```

> **Expo Go on a phone:** the store version of Expo Go is moving to SDK 58. If your installed
> Expo Go says the project is incompatible, update Expo Go, use an Android emulator/iOS simulator
> (Expo CLI installs the right Expo Go there), or make a development build:
> `eas build --profile development`.

## Test accounts (mock mode)
| Role  | Email                    | Password    |
|-------|--------------------------|-------------|
| Admin | kush@pawsnplay.com       | password123 |
| Admin | divya@pawsnplay.com      | password123 |
| Admin | shreya@pawsnplay.com     | password123 |

The login screen has quick-fill buttons for these while mocks are on.

## Scripts
| Command | What it does |
|---|---|
| `npm start` | Expo dev server |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint (eslint-config-expo) |
| `npm run doctor` | expo-doctor dependency check |

## Structure
```
app/                 # routes (Expo Router)
  (auth)/            # /login, /register
  admin/             # Dashboard, Bookings, Dogs, Profile + booking/dog forms
  user/, staff/      # placeholders (later phases)
src/
  api/               # axios client, types, endpoint functions, mock adapter
  auth/              # session store, secure token storage, RoleGate, permissions
  components/common/ # UI kit on React Native Paper (Button, TextInput, Card, ...)
  features/          # data hooks + feature components (bookings, dogs, dashboard, profile)
  theme/             # brand palette -> semantic theme -> Paper theme (change look in one place)
mock/                # mock backend: endpoints.json + data/*.json
docs/api-contract.md # API contract for the backend repo
scripts/deploy-web.sh # build + publish the web version on the EC2 instance
```

## Builds
`eas.json` has `development`, `preview` (internal APK / ad-hoc) and `production` profiles.
Production sets `EXPO_PUBLIC_USE_MOCKS=false`. Update `EXPO_PUBLIC_API_URL` there when the API is live.

## Web deploy (EC2, pawsnplaywithme.com)
The same code is also served as a website: `/faqs` and `/know-your-dog` (public) and `/admin` (team app).
First run the server repo's `scripts/deploy-ec2.sh` on the instance (Node 22, Nginx, HTTPS, API). Then, as the normal user:

```bash
# first time
git clone -b feat/admin-boarding https://github.com/kushdevui/PawsNPlayRender.git ~/PawsNPlayRender && cd ~/PawsNPlayRender && bash scripts/deploy-web.sh
# every update
cd ~/PawsNPlayRender && bash scripts/deploy-web.sh
```

`scripts/deploy-web.sh` fast-forwards the branch (refuses if there are uncommitted changes unless `FORCE=1`; `BRANCH=name` switches branch),
runs `npm ci`/`npm install`, builds with `npx expo export -p web` using `EXPO_PUBLIC_API_URL=$SITE_URL/api/v1` and mocks off
(`SITE_URL` comes from `~/.pawsnplay-deploy`, written by the server script; no `.env` is written), swaps the build into
`/var/www/pawsnplay/app` (previous build kept in `app.prev`), reloads Nginx and checks `/faqs`, `/know-your-dog`, `/admin` and `/api/v1/health`.
A failed build leaves the live site untouched. Build output goes to `dist-web/` (git-ignored).

## Working with Claude Code
Project rules are in `CLAUDE.md`. The `render-agent` subagent (`.claude/agents/render-agent.md`)
knows the stack and conventions. Ask it for screens, features and API wiring.
