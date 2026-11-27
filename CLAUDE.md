# PawsNPlayRender

Frontend for **PawsNPlay** - a React Native app (Expo) for Android and iOS, used by
**admin, user and other roles**. The Node.js REST backend lives in a separate repo.

- For any work in this repo, use the **`render-agent`** subagent (`.claude/agents/render-agent.md`);
  it holds the stack, structure, role/permission rules and API conventions.
- Run: `npm install` then `npx expo start`.
- Before finishing a change: `npx tsc --noEmit` and `npm run lint`.
- Requirements, data model and business rules: `docs/ARCHITECTURE.md`. Backend contract: `docs/BACKEND_API_SPEC.md` (summary: `docs/api-contract.md`).
  When an endpoint or rule changes in the mock (`src/api/mock/routes.ts`), update the spec in the same change.
- The app talks to the real Node API by default (`EXPO_PUBLIC_API_URL`, `localhost` is auto-swapped for the Mac's LAN IP in dev).
  Mock JSON in `mock/` is opt-in with `EXPO_PUBLIC_USE_MOCKS=true` (see `mock/README.md`).
  Admin logins: kush@ / divya@ / shreya@pawsnplay.com, password `password123`.
- UI: screens use only `@/components/common` (built on React Native Paper) and theme tokens from `@/theme`;
  no hard-coded colours/sizes. Brand = white background, black text, logo pink accents.
- Never commit `.env` files or tokens.
