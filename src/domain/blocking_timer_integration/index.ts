export type BlockingTimerIntegration = {
  shouldPauseBlockingDuringBreaks: boolean
  pauseBlockingWhenTimerIdle: boolean
}

export function newTestBlockingTimerIntegration({
  shouldPauseBlockingDuringBreaks = true,
  pauseBlockingWhenTimerIdle = false
}: Partial<BlockingTimerIntegration> = {}): BlockingTimerIntegration {
  return {
    shouldPauseBlockingDuringBreaks,
    pauseBlockingWhenTimerIdle
  }
}
