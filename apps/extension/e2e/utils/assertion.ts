import { sleep } from './operation.js'

export async function assertWithRetry(
  assert: () => Promise<void>,
  retryCount = 3,
  intervalMs = 500
) {
  try {
    await assert()
  } catch (Exception) {
    if (retryCount <= 0) {
      throw Exception
    }
    await sleep(intervalMs)
    return assertWithRetry(assert, retryCount - 1, intervalMs)
  }
}
