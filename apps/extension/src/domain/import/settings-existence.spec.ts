import { LocalStorageWrapper } from '@zero-in/shared/infra/storage/local-storage/index'
import { describe, expect, it } from 'vitest'
import { TimerConfig } from '../timer/config'
import { TimerConfigStorageService } from '../timer/config/storage'
import { SettingsExistenceService } from './settings-existence'

describe('SettingsExistenceService', () => {
  it('should hasSettings return false when no settings stored', async () => {
    const localStorage = LocalStorageWrapper.createFake()
    const service = SettingsExistenceService.createFake({
      storage: localStorage
    })

    const result = await service.hasSettings()
    expect(result).toBe(false)
  })

  it('should hasSettings return false if setting stored is not interested', async () => {
    const localStorage = LocalStorageWrapper.createFake()
    await localStorage.set('some_other_key', { data: 'not interested' })
    const service = SettingsExistenceService.createFake({
      storage: localStorage,
      interestedStorageKeys: ['interested_key_1']
    })

    const result = await service.hasSettings()
    expect(result).toBe(false)
  })

  it('should hasSettings return true if any interested setting is stored', async () => {
    const localStorage = LocalStorageWrapper.createFake()
    const storageService = new TimerConfigStorageService(localStorage)
    await storageService.save(TimerConfig.newTestInstance())

    const settingsExistenceService = SettingsExistenceService.createFake({
      storage: localStorage,
      interestedStorageKeys: [TimerConfigStorageService.STORAGE_KEY, 'interested_key_2']
    })

    const result = await settingsExistenceService.hasSettings()
    expect(result).toBe(true)
  })
})
