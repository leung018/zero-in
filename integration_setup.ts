import { LocalStorageUserIdCache } from '@/infra/local_storage_cache'
import { vi } from 'vitest'
import { LocalStorageWrapper } from './src/infra/storage/local_storage_wrapper'

vi.spyOn(LocalStorageUserIdCache, 'localStorageWrapper', 'get').mockReturnValue(
  LocalStorageWrapper.createFake()
)
