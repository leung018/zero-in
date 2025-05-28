export type BlockingTimerIntegration = {
  shouldPauseBlockingDuringBreaks: boolean
  shouldPauseBlockingWhenTimerIsNotRunning: boolean
}

export function newTestBlockingTimerIntegration({
  shouldPauseBlockingDuringBreaks = true,
  shouldPauseBlockingWhenTimerIsNotRunning = false
}: Partial<BlockingTimerIntegration> = {}): BlockingTimerIntegration {
  return {
    shouldPauseBlockingDuringBreaks,
    shouldPauseBlockingWhenTimerIsNotRunning
  }
}
