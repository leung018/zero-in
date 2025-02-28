import { Duration } from './duration'

export type PomodoroTimerConfig = {
  focusDuration: Duration
  shortBreakDuration: Duration
  longBreakDuration: Duration
  numOfFocusPerCycle: number
}

export const newTestPomodoroTimerConfig = ({
  focusDuration = new Duration({ minutes: 25 }),
  shortBreakDuration = new Duration({ minutes: 5 }),
  longBreakDuration = new Duration({ minutes: 15 }),
  numOfFocusPerCycle = 4
} = {}): PomodoroTimerConfig => {
  return {
    focusDuration,
    shortBreakDuration,
    longBreakDuration,
    numOfFocusPerCycle
  }
}
