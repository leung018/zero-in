export async function retryUntilSuccess<T>(
  fn: () => Promise<T>,
  {
    retryIntervalMs = 2000,
    functionName = ''
  }: { retryIntervalMs?: number; functionName?: string } = {}
): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    console.error(`Function ${functionName} failed, retrying...`, e)
    await new Promise((resolve) => setTimeout(resolve, retryIntervalMs))
    return retryUntilSuccess(fn, { retryIntervalMs, functionName })
  }
}
