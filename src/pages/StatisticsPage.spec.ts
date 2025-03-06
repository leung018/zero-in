import { describe, expect, it } from 'vitest'
import { DailyCutoffTimeStorageService } from '../domain/daily_cutoff_time/storage'
import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import StatisticsPage from './StatisticsPage.vue'
import { Time } from '../domain/time'

describe('StatisticsPage', () => {
  it('should render saved daily cutoff time', async () => {
    const dailyCutoffTimeStorageService = DailyCutoffTimeStorageService.createFake()
    dailyCutoffTimeStorageService.save(new Time(10, 30))

    const { wrapper } = mountStatisticsPage({
      dailyCutoffTimeStorageService
    })
    await flushPromises()

    const timerInput = wrapper.find("[data-test='timer-input']").element as HTMLInputElement
    expect(timerInput.value).toBe('10:30')
  })

  it('should render 00:00 if it has not been saved before', async () => {
    const { wrapper } = mountStatisticsPage({
      dailyCutoffTimeStorageService: DailyCutoffTimeStorageService.createFake() // No saved time before
    })
    await flushPromises()

    const timerInput = wrapper.find("[data-test='timer-input']").element as HTMLInputElement
    expect(timerInput.value).toBe('00:00')
  })

  it('should able to save daily cutoff time', async () => {
    const { wrapper, dailyCutoffTimeStorageService } = mountStatisticsPage()

    await saveTime(wrapper, '09:05')

    expect(await dailyCutoffTimeStorageService.get()).toEqual(new Time(9, 5))
  })
})

function mountStatisticsPage({
  dailyCutoffTimeStorageService = DailyCutoffTimeStorageService.createFake()
} = {}) {
  const wrapper = mount(StatisticsPage, {
    props: {
      dailyCutoffTimeStorageService
    }
  })
  return { wrapper, dailyCutoffTimeStorageService }
}

async function saveTime(wrapper: VueWrapper, newTime: string) {
  const timerInput = wrapper.find("[data-test='timer-input']")
  timerInput.setValue(newTime)

  const saveButton = wrapper.find("[data-test='save-button']")
  saveButton.trigger('click')
  await flushPromises()
}
