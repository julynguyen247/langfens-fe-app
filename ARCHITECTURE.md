# Application structure

- `src/app`: Next.js routes and feature-local components, types, and helpers. Pages compose feature components and own page-level state.
- `src/services`: API operations grouped by feature. These preserve backend request bodies, headers, defaults, and response shapes; callers handle UI state and errors.
- `src/utils/api.customize.ts`: Shared Axios clients, authentication headers, and token refresh. Service modules use these same client instances.
- `src/stores`: Shared Zustand stores. Import stores here so state has one owner outside the route tree.
- `src/hooks`: Reusable React hooks, including debounced attempt autosave.
- `src/lib`: Shared formatting, answer payload construction, speech playback, and URL helpers.
- `src/components`: Shared UI, including the stat card and band ruler.

Test-taking screens live in `src/app/do-test/[skill]/[attemptId]/screens` and are shared with result review. The landing scene separates sea creatures and particle layers into their own modules under `src/app/landing/three`.

Keep feature-specific differences explicit: history and analytics use different band-ruler fonts, and statement question variants use different answer values and selected colors. Similar formatting or parsing functions can have different contracts and should only be merged when those contracts match.

## Compatibility imports

`src/utils/api.ts`, `src/app/store/*`, and `src/app/utils/hook.ts` retain their original exports for existing consumers. New application code imports the owning service, store, hook, or helper directly. Re-exported stores share the same instance.

## Verification

Use Node.js 22 for the local checks:

```bash
npm run test:unit
npx tsc --noEmit --incremental false
npm run build
```

Unit tests cover service contracts, answer serialization, and statement selection rendering and callbacks. They use the existing TypeScript compiler and Node test runner without additional dependencies. The Playwright suite (`npm run e2e`) requires a running frontend, backend services, and seeded test data.
