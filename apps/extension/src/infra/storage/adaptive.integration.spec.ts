import { beforeEach, describe, expect, it } from 'vitest'
import { signInAndGetFirestoreStorage } from '../../test-utils/firestore'
import { FirebaseServices } from '../firebase/services'
import { AdaptiveStorageProvider } from './adaptive'
import { FakeObservableStorage } from './fake'

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

    const provider = new AdaptiveStorageProvider(FakeObservableStorage.create())

    await provider.set(TEST_KEY, testData)
    const data = await provider.get(TEST_KEY)
    expect(data).toStrictEqual(testData)

    await firestoreStorage.get(TEST_KEY)
    expect(data).toStrictEqual(testData)
  })

  it('should use unauthenticatedStorage if user is not authenticated', async () => {
    await FirebaseServices.signOut()

    const unauthenticatedStorage = FakeObservableStorage.create()
    const provider = new AdaptiveStorageProvider(unauthenticatedStorage)

    await provider.set(TEST_KEY, testData)
    const data = await provider.get(TEST_KEY)
    expect(data).toStrictEqual(testData)

    const unauthenticatedData = await unauthenticatedStorage.get(TEST_KEY)
    expect(unauthenticatedData).toStrictEqual(testData)
  })

  it('should able to subscribe and unsubscribe changes for firestore', async () => {
    const firestoreStorage = await signInAndGetFirestoreStorage()
    const provider = new AdaptiveStorageProvider(FakeObservableStorage.create())

    const receivedData: any[] = []
    const unsubscribe = await provider.onChange(TEST_KEY, (data) => {
      receivedData.push(data)
    })

    await firestoreStorage.set(TEST_KEY, { data: '1' })
    expect(receivedData).toStrictEqual([{ data: '1' }])

    unsubscribe()
    await firestoreStorage.set(TEST_KEY, { data: '2' })
    expect(receivedData).toStrictEqual([{ data: '1' }])
  })
})
