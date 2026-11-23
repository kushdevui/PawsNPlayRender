# API contract (Node REST backend)

Machine-readable list: **`mock/endpoints.json`**. Seed data: **`mock/data/*.json`**.
Business rules and MongoDB schemas: **`docs/ARCHITECTURE.md`**.
The app runs against the mock until the backend is ready (`EXPO_PUBLIC_USE_MOCKS=true`).

Base URL: `EXPO_PUBLIC_API_URL` (e.g. `http://<host>:4000/api/v1`) · Auth: `Authorization: Bearer <accessToken>`
Dates: ISO-8601 UTC strings. The app sends/receives UTC and shows local time.

## Response shapes
- Single: `{ "data": { ... } }`
- List: `{ "data": [ ... ], "meta": { "total": 12, "page": 1, "limit": 50 } }`
- Error: `{ "error": { "code": "CAPACITY_FULL", "message": "...", "details": { ... } } }`

| HTTP | code | When |
|---|---|---|
| 401 | UNAUTHORIZED, INVALID_CREDENTIALS, INVALID_TOKEN | not logged in / bad login |
| 403 | FORBIDDEN, ACCOUNT_INACTIVE | role not allowed |
| 404 | NOT_FOUND, ROUTE_NOT_FOUND | |
| 422 | VALIDATION_ERROR | bad input |
| 422 | DOG_ALREADY_BOOKED | dog has an overlapping open stay (`details.bookingId`) |
| 422 | CAPACITY_FULL | peak occupancy in the dates would exceed capacity (`details.peak`, `details.capacity`) |
| 422 | INVALID_STATE | status change / edit not allowed from current status |
| 422 | HAS_OPEN_BOOKINGS | archiving a dog with open stays |

## Endpoints
| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | /auth/login | public | `{email,password}` -> `{accessToken,refreshToken,user}` |
| POST | /auth/register | public | creates a `user` (customer) account |
| POST | /auth/refresh | public | `{refreshToken}` -> `{accessToken}` |
| POST | /auth/logout | any | |
| GET / PATCH | /me | any | current user |
| GET | /users | admin | filters: role, status, search |
| GET / PATCH | /users/:id | admin | change role / status |
| GET | /dogs | admin, staff | `search`, `status` = active (default) / archived / all; sorted by name |
| GET | /dogs/:id | admin, staff | |
| POST | /dogs | admin | name, ownerName, ownerPhone required |
| PATCH | /dogs/:id | admin | partial update; `status: archived` blocked while open stays exist |
| GET | /bookings | admin, staff | `from`,`to` (overlap), `status`, `dogId`; sorted by checkIn; includes `dog` summary |
| GET | /bookings/:id | admin, staff | |
| POST | /bookings | admin | `{dogId, checkIn, checkOut, kennel?, pricePerNight?, notes?}` -> status `confirmed` |
| PATCH | /bookings/:id | admin | edit dates/dog/kennel/price/notes (confirmed or checked_in only) |
| PATCH | /bookings/:id/status | admin, staff | check in / check out / cancel (see state machine) |
| GET | /settings | admin, staff | capacity, default times, price |
| PATCH | /settings | admin | |
| GET | /admin/dashboard | admin, staff | capacity, occupiedNow, today in/out, next 7 days, upcoming |

## Booking status flow
```
pending ──► confirmed ──► checked_in ──► checked_out
   │            │
   └────────────┴──► cancelled
```
`pending` is reserved for future customer-app requests. Admin-created bookings start as `confirmed`.
