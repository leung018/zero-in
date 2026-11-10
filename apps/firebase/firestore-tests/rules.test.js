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

describe('Deletion marker rules', () => {
  async function createDeletionMarker(uid) {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `deletedUsers/${uid}`), {})
    })
  }

  it('should allow a user to create their own deletion marker', async () => {
    const carolDb = testEnv.authenticatedContext('carol').firestore()

    await assertSucceeds(setDoc(doc(carolDb, 'deletedUsers/carol'), {}))
  })

  it('should allow a user to overwrite their own deletion marker', async () => {
    await createDeletionMarker('dave')
    const daveDb = testEnv.authenticatedContext('dave').firestore()

    await assertSucceeds(setDoc(doc(daveDb, 'deletedUsers/dave'), {}))
  })

  it('should deny a user from deleting their own deletion marker', async () => {
    await createDeletionMarker('dave')
    const daveDb = testEnv.authenticatedContext('dave').firestore()

    await assertFails(deleteDoc(doc(daveDb, 'deletedUsers/dave')))
  })

  it("should deny a user from creating another user's deletion marker", async () => {
    const bobDb = testEnv.authenticatedContext('bob').firestore()

    await assertFails(setDoc(doc(bobDb, 'deletedUsers/alice'), {}))
  })

  it('should deny a user from writing their own data after their deletion marker exists', async () => {
    await createDeletionMarker('erin')
    const erinDb = testEnv.authenticatedContext('erin').firestore()

    await assertFails(setDoc(doc(erinDb, 'users/erin'), { name: 'Erin' }))
    await assertFails(setDoc(doc(erinDb, 'users/erin/application/timerState'), { remaining: 1 }))
  })

  it('should allow a user to delete their own data after their deletion marker exists', async () => {
    await createDeletionMarker('frank')
    const frankDb = testEnv.authenticatedContext('frank').firestore()

    await assertSucceeds(deleteDoc(doc(frankDb, 'users/frank')))
    await assertSucceeds(deleteDoc(doc(frankDb, 'users/frank/application/timerState')))
  })

  it('should allow a user to read their own data after their deletion marker exists', async () => {
    await createDeletionMarker('grace')
    const graceDb = testEnv.authenticatedContext('grace').firestore()

    await assertSucceeds(getDoc(doc(graceDb, 'users/grace')))
    await assertSucceeds(getDoc(doc(graceDb, 'users/grace/application/timerState')))
  })
})
