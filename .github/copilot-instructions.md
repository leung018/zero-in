# Zero In - AI Coding Agent Instructions

## Project Overview

Zero In is a focus productivity tool with three platforms:

- **Browser Extension** (Chrome/Edge): Timer + website blocker using WXT framework (Vue 3, TypeScript)
- **Mobile App** (iOS/Android): React Native with Expo, native app blocking via Screen Time API
- **Firebase Backend**: Firestore for user data sync, Firebase Auth

This is a Yarn 4 monorepo with workspaces (`apps/*`, `packages/*`).

## Architecture Patterns

### Domain-Driven Design in Extension

The extension follows DDD with clear separation:

- **Domain Logic** (`apps/extension/src/domain/`): Pure business logic, framework-agnostic
  - Example: `BrowsingRules` class validates/manages blocked domains
  - Example: `FocusTimer` orchestrates timer state transitions
  - Domain services use dependency injection (see `BrowsingControlTogglingService`)

- **Infrastructure** (`apps/extension/src/infra/`): Platform adapters for browser APIs
  - Each service has an interface + implementation pattern
  - Example: `BrowsingControlService` interface with `BrowserBrowsingControlService` (prod) and `FakeBrowsingControlService` (test)
  - Storage abstraction: `StorageService<T>` interface for all persistence

- **Entry Points** (`apps/extension/src/entrypoints/`): WXT-managed UI pages
  - `popup/`, `options/`, `blocked.html`, `offscreen-*` (Firebase auth, sound playback)
  - Background service worker: `service-workers/index.ts` wires up the `BackgroundListener`

### Shared Package Structure

`@zero-in/shared` contains cross-platform code meant for reuse across extension and mobile:

- `domain/time/`: `Time` class for HH:MM operations
- `utils/format`: Number formatting helpers
- Import via `@zero-in/shared/domain/...` or `@zero-in/shared/utils/...`

**Important**: Domain logic that could benefit both platforms should be moved to `@zero-in/shared`. This includes:

- Pure business logic (validation, state management, calculations)
- Domain models and entities that aren't platform-specific
- Shared utilities and helpers

When moving domain logic from extension to shared, ensure it remains framework-agnostic and has no browser/mobile-specific dependencies.

### Testing Strategy

**Unit Tests** (`.spec.ts`):

- Use `FakeBrowsingControlService`, `FakeBadgeDisplayService` for isolation
- Run via `yarn test:unit` (Vitest with jsdom)
- Example: `browsing-control-toggling.spec.ts` uses fake timers (`vi.useFakeTimers()`)

**Integration Tests** (`.integration.spec.ts`):

- Run against Firebase emulators (auto-started via `yarn test:integration`)
- Separate Vitest project in `vitest.config.ts` with `VITE_USE_FIREBASE_EMULATOR=true`

**E2E Tests** (`e2e/*.spec.ts`):

- Playwright with custom fixtures loading built extension from `./dist/chrome-mv3`
- Must build first: `yarn build:ci` then `yarn test:e2e`
- Uses `data-test` attributes for selectors (not IDs/classes)
- Runs against Firebase emulators

### Mobile App Structure

Expo app with file-based routing (`app/` directory):

- `app/(tabs)/`: Tab navigation screens
- `app/sign-in.tsx`: Auth entry point
- Native modules in `modules/`: `app-blocker/` (Screen Time API), `google-sign-in/`
- Uses React Native Firebase (`@react-native-firebase/*`)

## Critical Workflows

### Running Tests

```bash
# Extension unit tests (from monorepo root)
yarn extension-test-unit

# Integration tests (auto-starts emulators)
cd apps/extension && yarn test:integration

# E2E tests
cd apps/extension && yarn build:ci && yarn test:e2e
```

### Development Servers

```bash
# Extension hot-reload
cd apps/extension && yarn dev

# Mobile app
cd apps/mobile && yarn start

# Firebase emulators (for local testing)
cd apps/extension && yarn firebase-emulators
```

### Building & Releasing

**Extension:**

- CI build: `yarn build:ci` (sets `VITE_USE_FIREBASE_EMULATOR=true`)
- Release: `node release.js <version>` from main branch (creates `extension-<version>` tag)

**Mobile:**

- `./build-and-submit.sh --platform=ios|android [--local]`
- Requires main branch, auto-submits to stores

### Configuration

**Firebase:**

- Config in `apps/extension/src/config.ts` (defaults + env overrides)
- Emulator setup: `apps/firebase/firebase.json`
- Security rules: `apps/firebase/firestore.rules` (user-scoped: `/users/{uid}`)

**Extension Manifest:**

- Generated via `wxt.config.ts` (MV3, permissions: storage, alarms, notifications, tabs)

## Project-Specific Conventions

1. **Fake Services for Testing**: Always provide `Fake*Service` implementations in `infra/` files for unit testing without browser APIs

2. **Storage Pattern**: All persistence uses `StorageService<T>` interface:

   ```typescript
   class XStorageService implements StorageService<X> {
     get(): Promise<X | null>
     save(data: X): Promise<void>
   }
   ```

3. **WXT Entry Points**: Pages must be in `entrypoints/<name>/index.html` or `.ts` files recognized by WXT's convention-based routing

4. **Timer Architecture**: `FocusTimer` in domain, `BackgroundListener` orchestrates via alarms/badges in service worker

5. **Cross-Extension Data Transfer**: Use `chrome.runtime.sendMessage` with external listeners (see README section)

6. **Bootstrap Vue Next**: UI components use `bootstrap-vue-next` with auto-import via `unplugin-vue-components`

7. **Icon System**: `unplugin-icons` with `@iconify-json/*` collections, auto-imports as Vue components

8. **Environment Variables**: Use `import.meta.env.VITE_*` for Firebase config overrides (see `config.ts`)

## Key Files Reference

- `apps/extension/src/service-workers/listener.ts`: Main orchestrator (timer, blocking, notifications)
- `apps/extension/src/domain/browsing-control-toggling.ts`: Schedule/timer-based blocking logic
- `apps/extension/wxt.config.ts`: Build config, manifest generation
- `apps/extension/vitest.config.ts`: Test project separation (unit/integration)
- `packages/shared/src/domain/time/`: Cross-platform time utilities
- `apps/firebase/firestore.rules`: Backend security (uid-based access)

## Common Pitfalls

- **Don't** run e2e tests without building first (`yarn build:ci`)
- **Don't** forget to set `VITE_USE_FIREBASE_EMULATOR=true` for local/CI testing
- **Don't** use real storage APIs in domain layer tests (inject `FakeStorage*`)
- **Don't** create releases from non-main branches (enforced in scripts)
- **Don't** assume synchronous storage (all `StorageService` methods are async)
