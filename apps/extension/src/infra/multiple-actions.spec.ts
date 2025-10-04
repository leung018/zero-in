import { describe, expect, it } from 'vitest'
import { FakeActionService } from './action'
import { MultipleActionService } from './multiple-actions'

describe('MultipleActionsService', () => {
  it('should be able to trigger all the actions', () => {
    const fakeActionService1 = new FakeActionService()
    const fakeActionService2 = new FakeActionService()

    const multipleActionsService = new MultipleActionService([
      fakeActionService1,
      fakeActionService2
    ])
    multipleActionsService.trigger()

    expect(fakeActionService1.hasTriggered()).toBe(true)
    expect(fakeActionService2.hasTriggered()).toBe(true)
  })
})
