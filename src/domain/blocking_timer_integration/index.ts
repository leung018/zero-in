export type BlockingTimerIntegration = {
  pauseBlockingDuringBreaks: boolean
  pauseBlockingWhenTimerIdle: boolean
}

export function newTestBlockingTimerIntegration({
  pauseBlockingDuringBreaks = true,
  pauseBlockingWhenTimerIdle = false
}: Partial<BlockingTimerIntegration> = {}): BlockingTimerIntegration {
  return {
    pauseBlockingDuringBreaks,
    pauseBlockingWhenTimerIdle
  }
}
