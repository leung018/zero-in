import type { BlockingTimerIntegration } from '.'
import { BlockingTimerIntegrationSchemas } from './schema'

type SerializedBlockingTimerIntegration = BlockingTimerIntegrationSchemas[1]

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
