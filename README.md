# PawsNPlay 🐾

React Native app (Expo SDK 58, Expo Router, TypeScript) for **pet parents, staff and admins**.
Runs on Android and iOS. The Node.js REST backend lives in a separate repo; until it is ready the
app runs on mock JSON (`mock/`).

## Getting started
Requires Node 22.13+ or 24.3+ (odd versions are not supported). With nvm: `nvm install && nvm use` (reads `.nvmrc`).

```bash
npm install
npx expo install --fix     # pins every Expo package to the SDK 58-compatible version
cp .env.example .env       # EXPO_PUBLIC_USE_MOCKS=true by default
npx expo start             # press a = Android, i = iOS simulator, or scan the QR code
```

> **Expo Go on a phone:** the store version of Expo Go is moving to SDK 58. If your installed
> Expo Go says the project is incompatible, update Expo Go, use an Android emulator/iOS simulator
> (Expo CLI installs the right Expo Go there), or make a development build:
> `eas build --profile development`.

## Test accounts (mock mode)
| Role  | Email                    | Password    |
|-------|--------------------------|-------------|
| Admin | admin@pawsnplay.com      | password123 |
| User  | priya@example.com        | password123 |
| Staff | neha.staff@pawsnplay.com | password123 |

The login screen has quick-fill buttons for these while mocks are on.

## Scripts
| Command | What it does |
|---|---|
| `npm start` | Expo dev server |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint (eslint-config-expo) |
| `npm test` | Jest (jest-expo) |
| `npm run doctor` | expo-doctor dependency check |

## Structure
```
app/                 # routes (Expo Router)
  (auth)/            # /login, /register
  user/              # pet parent tabs: Home, My Pets, Bookings, Profile
  admin/             # admin tabs: Dashboard, Bookings, Users, Profile
  staff/             # staff tabs: My Schedule, Profile
src/
  api/               # axios client, types, endpoint functions, mock adapter
  auth/              # session store, secure token storage, RoleGate, permissions
  components/ui/     # shared UI primitives
  features/          # data hooks + feature components (bookings, pets, services, admin, profile)
  theme/             # colors, spacing, typography
mock/                # mock backend: endpoints.json + data/*.json
docs/api-contract.md # API contract for the backend repo
```

## Builds
`eas.json` has `development`, `preview` (internal APK / ad-hoc) and `production` profiles.
Production sets `EXPO_PUBLIC_USE_MOCKS=false`. Update `EXPO_PUBLIC_API_URL` there when the API is live.

## Working with Claude Code
Project rules are in `CLAUDE.md`. The `render-agent` subagent (`.claude/agents/render-agent.md`)
knows the stack and conventions. Ask it for screens, features and API wiring.
