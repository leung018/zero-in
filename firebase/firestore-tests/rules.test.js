import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore'
import { readFileSync } from 'fs'
import { afterAll, beforeAll, describe, it } from 'vitest'

let testEnv

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-project',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8')
    }
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

describe('Firestore security rules', () => {
  it('should denies read if unauthenticated', async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore()
    const ref = doc(unauthDb, 'users/alice')
    await assertFails(getDoc(ref))
  })

  it('should allows a user to read their own document', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore()

    let ref = doc(aliceDb, 'users/alice/')
    await assertSucceeds(getDoc(ref))

    ref = doc(aliceDb, 'users/alice/profile/info')
    await assertSucceeds(getDoc(ref))
  })

  it("should denies a user from reading another user's document", async () => {
    const bobDb = testEnv.authenticatedContext('bob').firestore()

    let ref = doc(bobDb, 'users/alice/')
    await assertFails(getDoc(ref))

    ref = doc(bobDb, 'users/alice/profile/info')
    await assertFails(getDoc(ref))
  })

  it('should allows a user to write to their own document', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore()

    let ref = doc(aliceDb, 'users/alice')
    await assertSucceeds(setDoc(ref, { name: 'Alice' }))

    ref = doc(aliceDb, 'users/alice/profile/info')
    await assertSucceeds(setDoc(ref, { age: '90' }))
  })

  it("should denies a user from writing another user's document", async () => {
    const bobDb = testEnv.authenticatedContext('bob').firestore()

    let ref = doc(bobDb, 'users/alice')
    await assertFails(setDoc(ref, { name: 'My Wife Alice' }))

    ref = doc(bobDb, 'users/alice/profile/info')
    await assertFails(setDoc(ref, { age: '15' }))
  })

  it("should denies a user from deleting other user's document", async () => {
    const bobDb = testEnv.authenticatedContext('bob').firestore()

    let ref = doc(bobDb, 'users/alice')
    await assertFails(deleteDoc(ref))

    ref = doc(bobDb, 'users/alice/profile/info')
    await assertFails(deleteDoc(ref))
  })
})
