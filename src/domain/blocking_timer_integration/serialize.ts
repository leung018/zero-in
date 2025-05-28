import type { BlockingTimerIntegration } from '.'

type SerializedBlockingTimerIntegration = BlockingTimerIntegrationSchemas[1]

export type BlockingTimerIntegrationSchemas = [
  {
    shouldPauseBlockingDuringBreaks: boolean
  },
  {
    dataVersion: 1
    pauseBlockingDuringBreaks: boolean
    pauseBlockingWhenTimerIdle: boolean
  }
]

export function serializeBlockingTimerIntegration(
  integration: BlockingTimerIntegration
): SerializedBlockingTimerIntegration {
  return {
    dataVersion: 1,
    pauseBlockingDuringBreaks: integration.pauseBlockingDuringBreaks,
    pauseBlockingWhenTimerIdle: integration.pauseBlockingWhenTimerIdle
  }
}

export function deserializeBlockingTimerIntegration(
  data: SerializedBlockingTimerIntegration
): BlockingTimerIntegration {
  return {
    pauseBlockingDuringBreaks: data.pauseBlockingDuringBreaks,
    pauseBlockingWhenTimerIdle: data.pauseBlockingWhenTimerIdle
  }
}
