import { LocalStorageUserIdCache } from '@/infra/firebase/local-storage-cache'
import { LocalStorageWrapper } from '@zero-in/shared/infra/storage/local-storage/index'
import { vi } from 'vitest'

vi.spyOn(LocalStorageUserIdCache, 'localStorageWrapper', 'get').mockReturnValue(
  LocalStorageWrapper.createFake()
)

/**
 * Suppress Bootstrap Vue Next [v-b-toggle] warnings in test environment.
 *
 * The v-b-toggle directive generates warnings when target elements are not found
 * during component testing, but this doesn't affect functionality in production
 * where the full DOM structure is available. Since unit tests focus on component
 * logic rather than Bootstrap Vue directive behavior, these warnings are safely
 * suppressed to keep test output clean.
 */
const originalConsoleWarn = console.warn.bind(console)
console.warn = (...args: any[]) => {
  try {
    if (args.some((a) => typeof a === 'string' && a.includes('[v-b-toggle]'))) {
      return
    }
  } catch {
    // ignore and forward to original
  }
  originalConsoleWarn(...args)
}
