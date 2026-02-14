import { Duration } from '@zero-in/shared/domain/timer/duration'
import { TimerConfig } from '.'

export type SerializedTimerConfig = {
  focusDurationSeconds: number
  shortBreakDurationSeconds: number
  longBreakDurationSeconds: number
  focusSessionsPerCycle: number
}

export function serializeTimerConfig(config: TimerConfig): SerializedTimerConfig {
  return {
    focusDurationSeconds: config.focusDuration.remainingSeconds(),
    shortBreakDurationSeconds: config.shortBreakDuration.remainingSeconds(),
    longBreakDurationSeconds: config.longBreakDuration.remainingSeconds(),
    focusSessionsPerCycle: config.focusSessionsPerCycle
  }
}

export function deserializeTimerConfig(data: SerializedTimerConfig): TimerConfig {
  return new TimerConfig({
    focusDuration: new Duration({ seconds: data.focusDurationSeconds }),
    shortBreakDuration: new Duration({ seconds: data.shortBreakDurationSeconds }),
    longBreakDuration: new Duration({ seconds: data.longBreakDurationSeconds }),
    focusSessionsPerCycle: data.focusSessionsPerCycle
  })
}
