import { PomodoroStage } from '../stage'

export type TimerState = {
  remainingSeconds: number
  isRunning: boolean
  stage: PomodoroStage
  numOfPomodoriCompleted: number
}

export function newTestTimerState(override: Partial<TimerState> = {}): TimerState {
  return {
    remainingSeconds: 100,
    isRunning: false,
    stage: PomodoroStage.FOCUS,
    numOfPomodoriCompleted: 0,
    ...override
  }
}
