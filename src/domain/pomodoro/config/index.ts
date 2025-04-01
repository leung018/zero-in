import { Duration } from '../duration'

export class PomodoroTimerConfig {
  static newTestInstance({
    focusDuration = new Duration({ minutes: 25 }),
    shortBreakDuration = new Duration({ minutes: 5 }),
    longBreakDuration = new Duration({ minutes: 15 }),
    focusSessionsPerCycle = 4
  } = {}): PomodoroTimerConfig {
    return new PomodoroTimerConfig({
      focusDuration,
      shortBreakDuration,
      longBreakDuration,
      focusSessionsPerCycle
    })
  }

  readonly focusDuration: Duration
  readonly shortBreakDuration: Duration
  readonly longBreakDuration: Duration
  readonly focusSessionsPerCycle: number

  constructor({
    focusDuration,
    shortBreakDuration,
    longBreakDuration,
    focusSessionsPerCycle
  }: {
    focusDuration: Duration
    shortBreakDuration: Duration
    longBreakDuration: Duration
    focusSessionsPerCycle: number
  }) {
    if (
      focusDuration.totalMilliseconds < 1000 ||
      shortBreakDuration.totalMilliseconds < 1000 ||
      longBreakDuration.totalMilliseconds < 1000
    ) {
      throw new Error('Duration must not be less than 1 second')
    }

    if (focusSessionsPerCycle < 1) {
      throw new Error('Number of pomodori per cycle must be greater than 0')
    }

    this.focusDuration = focusDuration
    this.shortBreakDuration = shortBreakDuration
    this.longBreakDuration = longBreakDuration
    this.focusSessionsPerCycle = focusSessionsPerCycle
  }
}
