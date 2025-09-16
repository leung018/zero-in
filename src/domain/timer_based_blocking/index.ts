export type TimerBasedBlocking = {
  pauseBlockingDuringBreaks: boolean
  pauseBlockingWhenTimerNotRunning: boolean
}

export function newTestTimerBasedBlocking({
  pauseBlockingDuringBreaks = true,
  pauseBlockingWhenTimerNotRunning = false
}: Partial<TimerBasedBlocking> = {}): TimerBasedBlocking {
  return {
    pauseBlockingDuringBreaks,
    pauseBlockingWhenTimerNotRunning
  }
}
