import type { BlockingTimerIntegration } from '.'

type SerializedBlockingTimerIntegration = BlockingTimerIntegrationSchemas[1]

export type BlockingTimerIntegrationSchemas = [
  {
    shouldPauseBlockingDuringBreaks: boolean
  },
  {
    dataVersion: 1
    pauseBlockingDuringBreaks: boolean
    pauseBlockingWhenTimerNotRunning: boolean
  }
]

export function serializeBlockingTimerIntegration(
  integration: BlockingTimerIntegration
): SerializedBlockingTimerIntegration {
  return {
    dataVersion: 1,
    pauseBlockingDuringBreaks: integration.pauseBlockingDuringBreaks,
    pauseBlockingWhenTimerNotRunning: integration.pauseBlockingWhenTimerNotRunning
  }
}

export function deserializeBlockingTimerIntegration(
  data: SerializedBlockingTimerIntegration
): BlockingTimerIntegration {
  return {
    pauseBlockingDuringBreaks: data.pauseBlockingDuringBreaks,
    pauseBlockingWhenTimerNotRunning: data.pauseBlockingWhenTimerNotRunning
  }
}
