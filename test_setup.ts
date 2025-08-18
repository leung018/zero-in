import { LocalStorageUserIdCache } from '@/infra/firebase/local_storage_cache'
import { LocalStorageWrapper } from '@/infra/storage/local_storage/'
import { vi } from 'vitest'

vi.spyOn(LocalStorageUserIdCache, 'localStorageWrapper', 'get').mockReturnValue(
  LocalStorageWrapper.createFake()
)
