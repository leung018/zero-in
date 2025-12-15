/**
 * Global test function declarations for shared test suites.
 *
 * These globals allow shared test files to work with both Vitest (extension)
 * and Jest (mobile) without framework-specific imports.
 *
 * Vitest and Jest have compatible APIs, so the same test code can run in both.
 */
declare global {
  const it: typeof import('vitest').it
  const expect: typeof import('vitest').expect
  const describe: typeof import('vitest').describe
  const beforeEach: typeof import('vitest').beforeEach
  const afterEach: typeof import('vitest').afterEach
  const beforeAll: typeof import('vitest').beforeAll
  const afterAll: typeof import('vitest').afterAll
  const vi: typeof import('vitest').vi
}

export {}
