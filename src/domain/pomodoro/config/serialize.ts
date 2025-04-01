import { PomodoroTimerConfig } from '.'
import { Duration } from '../duration'

type SerializedPomodoroTimerConfig = {
  focusDurationSeconds: number
  shortBreakDurationSeconds: number
  longBreakDurationSeconds: number
  focusSessionsPerCycle: number
}

export function serializePomodoroTimerConfig(
  config: PomodoroTimerConfig
): SerializedPomodoroTimerConfig {
  return {
    focusDurationSeconds: config.focusDuration.remainingSeconds(),
    shortBreakDurationSeconds: config.shortBreakDuration.remainingSeconds(),
    longBreakDurationSeconds: config.longBreakDuration.remainingSeconds(),
    focusSessionsPerCycle: config.focusSessionsPerCycle
  }
}

export function deserializePomodoroTimerConfig(
  data: SerializedPomodoroTimerConfig
): PomodoroTimerConfig {
  return new PomodoroTimerConfig({
    focusDuration: new Duration({ seconds: data.focusDurationSeconds }),
    shortBreakDuration: new Duration({ seconds: data.shortBreakDurationSeconds }),
    longBreakDuration: new Duration({ seconds: data.longBreakDurationSeconds }),
    focusSessionsPerCycle: data.focusSessionsPerCycle
  })
}
