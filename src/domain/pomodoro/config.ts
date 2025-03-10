import { Duration } from './duration'

export type PomodoroTimerConfig = {
  focusDuration: Duration
  shortBreakDuration: Duration
  longBreakDuration: Duration
  numOfPomodoriPerCycle: number
}

export const newTestPomodoroTimerConfig = ({
  focusDuration = new Duration({ minutes: 25 }),
  shortBreakDuration = new Duration({ minutes: 5 }),
  longBreakDuration = new Duration({ minutes: 15 }),
  numOfPomodoriPerCycle = 4
} = {}): PomodoroTimerConfig => {
  return {
    focusDuration,
    shortBreakDuration,
    longBreakDuration,
    numOfPomodoriPerCycle
  }
}
