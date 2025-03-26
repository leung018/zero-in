import { Duration } from '../duration'

export class PomodoroTimerConfig {
  static newTestInstance({
    focusDuration = new Duration({ minutes: 25 }),
    shortBreakDuration = new Duration({ minutes: 5 }),
    longBreakDuration = new Duration({ minutes: 15 }),
    numOfPomodoriPerCycle = 4,
    pomodoroRecordHouseKeepDays = 30
  } = {}): PomodoroTimerConfig {
    return new PomodoroTimerConfig({
      focusDuration,
      shortBreakDuration,
      longBreakDuration,
      numOfPomodoriPerCycle,
      pomodoroRecordHouseKeepDays
    })
  }

  readonly focusDuration: Duration
  readonly shortBreakDuration: Duration
  readonly longBreakDuration: Duration
  readonly numOfPomodoriPerCycle: number
  readonly pomodoroRecordHouseKeepDays: number

  constructor({
    focusDuration,
    shortBreakDuration,
    longBreakDuration,
    numOfPomodoriPerCycle,
    pomodoroRecordHouseKeepDays
  }: {
    focusDuration: Duration
    shortBreakDuration: Duration
    longBreakDuration: Duration
    numOfPomodoriPerCycle: number
    pomodoroRecordHouseKeepDays: number
  }) {
    this.focusDuration = focusDuration
    this.shortBreakDuration = shortBreakDuration
    this.longBreakDuration = longBreakDuration
    this.numOfPomodoriPerCycle = numOfPomodoriPerCycle
    this.pomodoroRecordHouseKeepDays = pomodoroRecordHouseKeepDays
  }
}
