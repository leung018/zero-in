import type { BlockingTimerIntegration } from '.'

type SerializedBlockingTimerIntegration = BlockingTimerIntegrationSchemas[1]

export type BlockingTimerIntegrationSchemas = [
  {
    shouldPauseBlockingDuringBreaks: boolean
  },
  {
    dataVersion: 1
    shouldPauseBlockingDuringBreaks: boolean
    shouldPauseBlockingWhenTimerIsNotRunning: boolean
  }
]

export function serializeBlockingTimerIntegration(
  integration: BlockingTimerIntegration
): SerializedBlockingTimerIntegration {
  return {
    dataVersion: 1,
    shouldPauseBlockingDuringBreaks: integration.shouldPauseBlockingDuringBreaks,
    shouldPauseBlockingWhenTimerIsNotRunning: integration.shouldPauseBlockingWhenTimerIsNotRunning
  }
}

export function deserializeBlockingTimerIntegration(
  data: SerializedBlockingTimerIntegration
): BlockingTimerIntegration {
  return {
    shouldPauseBlockingDuringBreaks: data.shouldPauseBlockingDuringBreaks,
    shouldPauseBlockingWhenTimerIsNotRunning: data.shouldPauseBlockingWhenTimerIsNotRunning
  }
}
