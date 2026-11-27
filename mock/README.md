# Mock backend

Until the Node REST API is ready, the app reads from these JSON files through a mock
adapter (`src/api/mock/`). Screens call the **same functions** (`src/api/endpoints/*`)
they will use against the real API, so switching later is one env change.

## Folder
```
mock/
  endpoints.json        # every endpoint: method, path, roles, body, response, source file
  data/
    users.json          # admins (Kush, Divya, Shreya), staff, customers - password for all: password123
    dogs.json           # 12 dogs with owner + care info
    bookings.json       # boarding stays around Nov-Dec 2026 (some checked in "now")
    settings.json       # capacity (15), default check-in/out times, price per night
    questionnaires.json # 2 sample Know Your Dog submissions (POST /questionnaires is acknowledged, not stored)
    waivers.json        # current waiver text + consents (mirrors the Nov 2026 PDF) and 1 signed waiver; POST /waivers is stored in memory
```

## Switching mock <-> real API
The real API is the default. `.env`:
```
EXPO_PUBLIC_USE_MOCKS=true                          # opt in to mock/data/*.json
EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1    # localhost -> your Mac's LAN IP automatically in dev
```
Restart `npx expo start -c` after changing env vars.

## Test logins
| Role  | Email                       | Password    |
|-------|-----------------------------|-------------|
| admin | kush@pawsnplay.com          | password123 |
| admin | divya@pawsnplay.com         | password123 |
| admin | shreya@pawsnplay.com        | password123 |
| user  | priya@example.com           | password123 |
| user  | rohan@example.com           | password123 |
| staff | neha.staff@pawsnplay.com    | password123 |
| staff | vikram.staff@pawsnplay.com  | password123 |
| user (inactive, login blocked) | ananya@example.com | password123 |

## Behaviour
- Data is loaded into memory on app start; creates/updates/deletes work but reset on reload.
- ~300 ms simulated latency; role checks match `endpoints.json` (401 / 403 / 404 / 422 errors).
- Mock tokens look like `mock-access-u_002` - never used by the real backend.
- Business rules (capacity, double booking, status flow, nights) are implemented in
  `src/api/mock/routes.ts` exactly as described in `docs/ARCHITECTURE.md` section 6.
- Seed dates are fixed around 23 Nov 2026. If you run the app much later, the dashboard will look
  empty - shift the dates in `bookings.json` (or add bookings in the app).

## For the backend repo
`endpoints.json` + `data/*.json` are the contract: build the Node routes to return exactly
these shapes (`{ data }`, `{ data, meta }`, `{ error: { code, message } }`), and use the JSON
files as seed data.
