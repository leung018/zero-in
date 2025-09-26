import type { TimerBasedBlockingRules } from '.'
import { TimerBasedBlockingRulesSchemas } from './schema'

type SerializedTimerBasedBlockingRules = TimerBasedBlockingRulesSchemas[1]

export function serializeTimerBasedBlockingRules(
  integration: TimerBasedBlockingRules
): SerializedTimerBasedBlockingRules {
  return {
    dataVersion: 1,
    pauseBlockingDuringBreaks: integration.pauseBlockingDuringBreaks,
    pauseBlockingWhenTimerNotRunning: integration.pauseBlockingWhenTimerNotRunning
  }
}

export function deserializeTimerBasedBlockingRules(
  data: SerializedTimerBasedBlockingRules
): TimerBasedBlockingRules {
  return {
    pauseBlockingDuringBreaks: data.pauseBlockingDuringBreaks,
    pauseBlockingWhenTimerNotRunning: data.pauseBlockingWhenTimerNotRunning
  }
}
