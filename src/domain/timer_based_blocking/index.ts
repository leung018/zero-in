export type TimerBasedBlockingRules = {
  pauseBlockingDuringBreaks: boolean
  pauseBlockingWhenTimerNotRunning: boolean
}

export function newTestTimerBasedBlockingRules({
  pauseBlockingDuringBreaks = true,
  pauseBlockingWhenTimerNotRunning = false
}: Partial<TimerBasedBlockingRules> = {}): TimerBasedBlockingRules {
  return {
    pauseBlockingDuringBreaks,
    pauseBlockingWhenTimerNotRunning
  }
}
