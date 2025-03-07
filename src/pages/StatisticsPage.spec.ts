import { describe, expect, it } from 'vitest'
import { DailyCutoffTimeStorageService } from '../domain/daily_cutoff_time/storage'
import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import StatisticsPage from './StatisticsPage.vue'
import { Time } from '../domain/time'
import { FakeActionService } from '../infra/action'

describe('StatisticsPage', () => {
  it('should render saved daily cutoff time', async () => {
    const dailyCutoffTimeStorageService = DailyCutoffTimeStorageService.createFake()
    dailyCutoffTimeStorageService.save(new Time(10, 30))

    const { wrapper } = mountStatisticsPage({
      dailyCutoffTimeStorageService
    })
    await flushPromises()

    const timerInput = wrapper.find("[data-test='time-input']").element as HTMLInputElement
    expect(timerInput.value).toBe('10:30')
  })

  it('should render 00:00 if it has not been saved before', async () => {
    const { wrapper } = mountStatisticsPage({
      dailyCutoffTimeStorageService: DailyCutoffTimeStorageService.createFake() // No saved time before
    })
    await flushPromises()

    const timerInput = wrapper.find("[data-test='time-input']").element as HTMLInputElement
    expect(timerInput.value).toBe('00:00')
  })

  it('should able to save daily cutoff time', async () => {
    const { wrapper, dailyCutoffTimeStorageService } = mountStatisticsPage()

    await saveTime(wrapper, '09:05')

    expect(await dailyCutoffTimeStorageService.get()).toEqual(new Time(9, 5))
  })

  it('should reload page after clicked save', async () => {
    const { wrapper, reloadService } = mountStatisticsPage()

    expect(reloadService.getTriggerCount()).toBe(0)

    await saveTime(wrapper, '15:05')

    expect(reloadService.getTriggerCount()).toBe(1)
  })
})

function mountStatisticsPage({
  dailyCutoffTimeStorageService = DailyCutoffTimeStorageService.createFake()
} = {}) {
  const reloadService = new FakeActionService()
  const wrapper = mount(StatisticsPage, {
    props: {
      dailyCutoffTimeStorageService,
      reloadService
    }
  })
  return { wrapper, dailyCutoffTimeStorageService, reloadService }
}

async function saveTime(wrapper: VueWrapper, newTime: string) {
  const timerInput = wrapper.find("[data-test='time-input']")
  timerInput.setValue(newTime)

  const saveButton = wrapper.find("[data-test='save-button']")
  saveButton.trigger('click')
  await flushPromises()
}
