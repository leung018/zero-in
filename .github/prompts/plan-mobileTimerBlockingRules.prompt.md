## Plan: Mobile Timer-Rule Blocking Integration (DRAFT)

Integrate timer-based blocking rules into mobile `AppBlockTogglingService` (domain-only scope) using TDD, mirroring extension rule semantics while keeping current mobile architecture clean. Based on your decisions: add a mobile timer state adapter seam (`TimerInfoGetter` pattern), keep this task limited to domain + unit tests, and enforce that `pauseBlockingWhenTimerNotRunning=true` always unblocks even if a schedule exists. Since mobile currently has no timer runtime source wired in domain, the plan introduces dependency injection first, then drives behavior via failing tests in [apps/mobile/domain/app-block-toggling.spec.ts](apps/mobile/domain/app-block-toggling.spec.ts), with minimal factory wiring in [apps/mobile/factories.ts](apps/mobile/factories.ts).

**Steps**

1. Add first failing test in [apps/mobile/domain/app-block-toggling.spec.ts](apps/mobile/domain/app-block-toggling.spec.ts) for `pauseBlockingWhenTimerNotRunning=true` + timer not running ⇒ clears schedule + unblocks (override schedule), then implement minimal service change in [apps/mobile/domain/app-block-toggling.ts](apps/mobile/domain/app-block-toggling.ts).
2. Add second failing test for `pauseBlockingWhenTimerNotRunning=true` + running focus timer ⇒ schedule from “now to session end” (timer-driven span), then implement timer-span branch in `AppBlockTogglingService.run`.
3. Add third failing test for `pauseBlockingWhenTimerNotRunning=false` + `pauseBlockingDuringBreaks=true` + break running ⇒ schedule starts at break end and ends at schedule end; implement break-adjusted scheduling logic in `AppBlockTogglingService`.
4. Add fourth failing test for click pause during break (not running while in break under `pauseBlockingDuringBreaks=true`) ⇒ unblock; implement corresponding guard path.
5. Add fifth failing test for `pauseBlockingWhenTimerNotRunning=false` + `pauseBlockingDuringBreaks=false` ⇒ unchanged schedule behavior (regression lock), then refactor internals to keep logic readable and deterministic.
6. Introduce injected timer/rules deps in service constructor + `createFake`: `TimerBasedBlockingRulesStorageService` and `TimerInfoGetter` (shared interface from [packages/shared/src/domain/blocking-toggling.ts](packages/shared/src/domain/blocking-toggling.ts)); update [apps/mobile/factories.ts](apps/mobile/factories.ts) to pass rules storage via [apps/mobile/domain/timer-based-blocking/storage.ts](apps/mobile/domain/timer-based-blocking/storage.ts) and a temporary mobile timer getter adapter seam.
7. Keep `toggling-runner` unchanged for this task (domain-only scope), but ensure behavior is reachable through existing `triggerAppBlockToggling` flow in [apps/mobile/infra/app-block/toggling-runner.ts](apps/mobile/infra/app-block/toggling-runner.ts).

**Verification**

- Run failing-first cycle per test: `yarn workspace @zero-in/mobile test:unit apps/mobile/domain/app-block-toggling.spec.ts` (or jest pattern equivalent).
- After all greens, run targeted suite: `yarn workspace @zero-in/mobile test:unit app-block-toggling`.
- Optional confidence pass: `yarn workspace @zero-in/mobile test:unit`.
- Confirm no regressions in timer settings component tests: `yarn workspace @zero-in/mobile test:unit TimerBasedSetting`.

**Decisions**

- Timer source: add new mobile `TimerInfoGetter` adapter seam (DI-based).
- Scope: domain + unit tests only (no event wiring for start/pause/break/end in this task).
- Priority: `pauseBlockingWhenTimerNotRunning=true` overrides active schedules and unblocks.
