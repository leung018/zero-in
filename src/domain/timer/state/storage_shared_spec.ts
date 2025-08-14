import { expect, it } from 'vitest'
import { StorageInterface } from '../../../infra/storage/interface'
import { Duration } from '../duration'
import { TimerStage } from '../stage'
import { TimerInternalState } from './internal'
import { TimerStateStorageService } from './storage'

export function runTimerStateStorageServiceTests(storage: StorageInterface) {
  it('should get null if no TimerState is saved ', async () => {
    const service = new TimerStateStorageService(storage)
    expect(await service.get()).toBeNull()
  })

  it('should save and get TimerState', async () => {
    const service = new TimerStateStorageService(storage)

    const state = TimerInternalState.newPausedState({
      timerId: 'id01',
      remaining: new Duration({ seconds: 100 }),
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 9
    })
    await service.save(state)
    expect(await service.get()).toStrictEqual(state)

    const state2 = TimerInternalState.newRunningState({
      timerId: 'id02',
      sessionStartTime: new Date(),
      remaining: new Duration({ seconds: 100 }),
      stage: TimerStage.SHORT_BREAK,
      focusSessionsCompleted: 0
    })
    await service.save(state2)
    expect(await service.get()).toStrictEqual(state2)
  })

  it('should onChange triggered when TimerState is changed', async () => {
    const service = new TimerStateStorageService(storage)
    const states: TimerInternalState[] = []
    service.onChange((data) => {
      states.push(data)
    })

    const targetState = TimerInternalState.newTestInstance()

    await service.save(targetState)
    expect(states).toEqual([targetState])
  })
}
