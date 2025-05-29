export type BlockingTimerIntegration = {
  pauseBlockingDuringBreaks: boolean
  pauseBlockingWhenTimerNotRunning: boolean
}

export function newTestBlockingTimerIntegration({
  pauseBlockingDuringBreaks = true,
  pauseBlockingWhenTimerNotRunning = false
}: Partial<BlockingTimerIntegration> = {}): BlockingTimerIntegration {
  return {
    pauseBlockingDuringBreaks,
    pauseBlockingWhenTimerNotRunning
  }
}
