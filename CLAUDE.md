# PawsNPlayRender

Frontend for **PawsNPlay** - a React Native app (Expo) for Android and iOS, used by
**admin, user and other roles**. The Node.js REST backend lives in a separate repo.

- For any work in this repo, use the **`render-agent`** subagent (`.claude/agents/render-agent.md`);
  it holds the stack, structure, role/permission rules and API conventions.
- Run: `npm install` then `npx expo start`.
- Before finishing a change: `npx tsc --noEmit` and `npm run lint`.
- Backend endpoints are documented in `docs/api-contract.md` - keep it in sync with the API repo.
- Until the backend is ready the app uses mock JSON in `mock/` (`EXPO_PUBLIC_USE_MOCKS=true`, see `mock/README.md`).
  Test logins: admin@pawsnplay.com / priya@example.com / neha.staff@pawsnplay.com, password `password123`.
- UI: screens use only `@/components/common` (built on React Native Paper) and theme tokens from `@/theme`;
  no hard-coded colours/sizes. Brand = white background, black text, logo pink accents.
- Never commit `.env` files or tokens.
