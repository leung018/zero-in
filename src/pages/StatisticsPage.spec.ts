import { describe, expect, it } from 'vitest'
import { DailyCutoffTimeStorageService } from '../domain/daily_cutoff_time/storage'
import { flushPromises, mount } from '@vue/test-utils'
import StatisticsPage from './StatisticsPage.vue'
import { Time } from '../domain/schedules/time'

describe('StatisticsPage', () => {
  it('should render saved daily refresh time', async () => {
    const dailyCutoffTimeStorageService = DailyCutoffTimeStorageService.createFake()
    dailyCutoffTimeStorageService.save(new Time(10, 30))

    const { wrapper } = mountDailyCutoffTimePage({
      dailyCutoffTimeStorageService
    })
    await flushPromises()

    const timerInput = wrapper.find("[data-test='timer-input']").element as HTMLInputElement
    expect(timerInput.value).toBe('10:30')
  })
})

function mountDailyCutoffTimePage({
  dailyCutoffTimeStorageService = DailyCutoffTimeStorageService.createFake()
} = {}) {
  const wrapper = mount(StatisticsPage, {
    props: {
      dailyCutoffTimeStorageService
    }
  })
  return { wrapper }
}
