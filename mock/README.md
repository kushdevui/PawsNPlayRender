# Mock backend

Until the Node REST API is ready, the app reads from these JSON files through a mock
adapter (`src/api/mock/`). Screens call the **same functions** (`src/api/endpoints/*`)
they will use against the real API, so switching later is one env change.

## Folder
```
mock/
  endpoints.json        # every endpoint: method, path, roles, body, response, source file
  data/
    users.json          # admin, users, staff  (password for all: password123)
    pets.json
    services.json
    bookings.json
    notifications.json
```

## Switching mock <-> real API
`.env`:
```
EXPO_PUBLIC_USE_MOCKS=true          # true = serve from mock/, false = real backend
EXPO_PUBLIC_API_URL=http://192.168.1.10:4000/api/v1
```
Restart `npx expo start -c` after changing env vars.

## Test logins
| Role  | Email                       | Password    |
|-------|-----------------------------|-------------|
| admin | admin@pawsnplay.com         | password123 |
| user  | priya@example.com           | password123 |
| user  | rohan@example.com           | password123 |
| staff | neha.staff@pawsnplay.com    | password123 |
| staff | vikram.staff@pawsnplay.com  | password123 |
| user (inactive, login blocked) | ananya@example.com | password123 |

## Behaviour
- Data is loaded into memory on app start; creates/updates/deletes work but reset on reload.
- ~300 ms simulated latency; role checks match `endpoints.json` (401 / 403 / 404 / 422 errors).
- Mock tokens look like `mock-access-u_002` - never used by the real backend.

## For the backend repo
`endpoints.json` + `data/*.json` are the contract: build the Node routes to return exactly
these shapes (`{ data }`, `{ data, meta }`, `{ error: { code, message } }`), and use the JSON
files as seed data.
