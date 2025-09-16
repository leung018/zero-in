import type { TimerBasedBlocking } from '.'
import { TimerBasedBlockingSchemas } from './schema'

type SerializedTimerBasedBlocking = TimerBasedBlockingSchemas[1]

export function serializeTimerBasedBlocking(
  integration: TimerBasedBlocking
): SerializedTimerBasedBlocking {
  return {
    dataVersion: 1,
    pauseBlockingDuringBreaks: integration.pauseBlockingDuringBreaks,
    pauseBlockingWhenTimerNotRunning: integration.pauseBlockingWhenTimerNotRunning
  }
}

export function deserializeTimerBasedBlocking(
  data: SerializedTimerBasedBlocking
): TimerBasedBlocking {
  return {
    pauseBlockingDuringBreaks: data.pauseBlockingDuringBreaks,
    pauseBlockingWhenTimerNotRunning: data.pauseBlockingWhenTimerNotRunning
  }
}
