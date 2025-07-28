import { beforeEach, describe, expect, it } from 'vitest'
import { signInAndGetFirestoreStorage } from '../../test_utils/firestore'
import { FirebaseServices } from '../firebase_services'
import { LocalStorageWrapper } from './local_storage_wrapper'
import { AdaptiveStorageProvider } from './provider'

describe('AdaptiveStorageProvider', async () => {
  const TEST_KEY = 'testKey'
  const testData = {
    name: 'test'
  }

  beforeEach(async () => {
    ;(await signInAndGetFirestoreStorage()).delete(TEST_KEY)
  })

  it('should use firebaseStorage if user is authenticated', async () => {
    const firestoreStorage = await signInAndGetFirestoreStorage()

    const provider = new AdaptiveStorageProvider(LocalStorageWrapper.createFake())

    await provider.set(TEST_KEY, testData)
    const data = await provider.get(TEST_KEY)
    expect(data).toStrictEqual(testData)

    await firestoreStorage.get(TEST_KEY)
    expect(data).toStrictEqual(testData)
  })

  it('should use unauthenticatedStorage if user is not authenticated', async () => {
    await FirebaseServices.signOut()

    const unauthenticatedStorage = LocalStorageWrapper.createFake()
    const provider = new AdaptiveStorageProvider(unauthenticatedStorage)

    await provider.set(TEST_KEY, testData)
    const data = await provider.get(TEST_KEY)
    expect(data).toStrictEqual(testData)

    const unauthenticatedData = await unauthenticatedStorage.get(TEST_KEY)
    expect(unauthenticatedData).toStrictEqual(testData)
  })
})
